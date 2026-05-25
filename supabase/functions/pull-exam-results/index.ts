import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LIST_ATTEMPTS_URL = "https://mjewqdginfurpujyvmds.supabase.co/functions/v1/list-attempts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Attempt = {
  attempt_id: string;
  exam_id?: string;
  exam_title?: string;
  enrollment_no?: string;
  theory_marks?: number;
  theory_total?: number;
  score?: number;
  total_questions?: number;
  percentage?: number;
  completed_at?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json(401, { error: "Unauthorized" });
  }
  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: isSuper } = await admin.rpc("has_role", { _user_id: userId, _role: "super_admin" });
  if (!isSuper) {
    return json(403, { error: "Forbidden" });
  }

  const apiKey = Deno.env.get("EXAM_PORTAL_API_KEY");
  if (!apiKey) return json(500, { error: "EXAM_PORTAL_API_KEY not configured" });

  const incoming = new URL(req.url);
  const upstream = new URL(LIST_ATTEMPTS_URL);
  for (const k of ["exam_id", "enrollment_id", "from", "to", "passed", "limit", "offset"]) {
    const v = incoming.searchParams.get(k);
    if (v) upstream.searchParams.set(k, v);
  }
  if (!upstream.searchParams.has("limit")) upstream.searchParams.set("limit", "500");

  const upstreamRes = await fetch(upstream.toString(), {
    method: "GET",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
  });
  const upstreamText = await upstreamRes.text();
  if (!upstreamRes.ok) {
    console.error("list-attempts upstream error", upstreamRes.status, upstreamText);
    return json(502, { error: `Exam portal returned ${upstreamRes.status}`, detail: upstreamText });
  }

  let parsed: { attempts?: Attempt[] };
  try {
    parsed = JSON.parse(upstreamText);
  } catch {
    return json(502, { error: "invalid_upstream_json" });
  }
  const attempts = Array.isArray(parsed.attempts) ? parsed.attempts : [];

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const a of attempts) {
    try {
      const enrollment_no = (a.enrollment_no ?? "").trim();
      const attempt_id = (a.attempt_id ?? "").trim();
      if (!enrollment_no || !attempt_id) {
        skipped++;
        continue;
      }

      const { data: student } = await admin
        .from("students")
        .select("id, course_id, courses(theory_max_marks, practical_max_marks)")
        .eq("enrollment_no", enrollment_no)
        .maybeSingle();
      if (!student) {
        skipped++;
        continue;
      }

      const completed_at = a.completed_at ? new Date(a.completed_at) : new Date();
      if (isNaN(completed_at.getTime())) {
        skipped++;
        continue;
      }

      // Idempotency check
      const { data: existingHist } = await admin
        .from("exam_history")
        .select("id")
        .eq("student_id", student.id)
        .eq("external_attempt_id", attempt_id)
        .maybeSingle();
      if (existingHist) {
        skipped++;
        continue;
      }

      const { error: histErr } = await admin.from("exam_history").insert({
        student_id: student.id,
        exam_id: a.exam_id ?? null,
        exam_title: a.exam_title ?? null,
        completed_at: completed_at.toISOString(),
        external_attempt_id: attempt_id,
        raw_payload: a as unknown as Record<string, unknown>,
      });
      if (histErr) {
        failed++;
        errors.push(`${enrollment_no}: ${histErr.message}`);
        continue;
      }

      const courseRow = (student as { courses?: { theory_max_marks?: number; practical_max_marks?: number } }).courses;
      const theory_marks = Number(a.theory_marks ?? a.score ?? a.percentage ?? 0);
      const theory_total = Number(a.theory_total ?? a.total_questions ?? courseRow?.theory_max_marks ?? 100);
      const practical_total = Number(courseRow?.practical_max_marks ?? 100);
      const exam_date = completed_at.toISOString().slice(0, 10);

      const { data: existing } = await admin
        .from("student_results")
        .select("id, status, practical_submitted_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existing) {
        await admin.from("student_results").insert({
          student_id: student.id,
          course_id: (student as { course_id: string }).course_id,
          exam_date,
          theory_marks,
          theory_total,
          practical_total,
          total_marks: theory_total + practical_total,
          marks_obtained: theory_marks,
          status: "awaiting_practical",
        });
      } else if (existing.status === "awaiting_practical" && !existing.practical_submitted_at) {
        await admin
          .from("student_results")
          .update({ theory_marks, theory_total })
          .eq("id", existing.id);
      }

      await admin
        .from("students")
        .update({
          exam_status: "completed",
          exam_completed_at: completed_at.toISOString(),
          exam_locked: true,
        })
        .eq("id", student.id);

      imported++;
    } catch (e) {
      failed++;
      errors.push(e instanceof Error ? e.message : "unknown");
    }
  }

  return json(200, {
    ok: true,
    fetched: attempts.length,
    imported,
    skipped,
    failed,
    errors: errors.slice(0, 10),
  });
});