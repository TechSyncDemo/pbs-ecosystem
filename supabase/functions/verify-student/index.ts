import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  // API key check
  const expectedKey = Deno.env.get("ECOSYSTEM_API_KEY");
  const providedKey = req.headers.get("x-api-key") ?? "";
  if (!expectedKey || !timingSafeEqual(expectedKey, providedKey)) {
    return json(401, { ok: false, error: "unauthorized" });
  }

  let body: { enrollment_id?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const enrollment_id = (body.enrollment_id ?? "").trim();
  const password = (body.password ?? "").trim();
  if (!enrollment_id || !password) {
    return json(400, { ok: false, error: "missing_fields" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: student, error } = await supabase
    .from("students")
    .select(
      "id, name, email, phone, password, status, exam_status, exam_locked, center_id, course_id, centers(name), courses(name)"
    )
    .eq("enrollment_no", enrollment_id)
    .maybeSingle();

  if (error) {
    console.error("verify-student lookup error", error);
    return json(500, { ok: false, error: "lookup_failed" });
  }
  if (!student) return json(401, { ok: false, error: "invalid_credentials" });

  // Constant-time password compare (passwords are currently plaintext 6-char codes)
  if (!student.password || !timingSafeEqual(student.password, password)) {
    return json(401, { ok: false, error: "invalid_credentials" });
  }

  if (student.status && student.status !== "active") {
    return json(403, { ok: false, error: "student_inactive" });
  }
  if (student.exam_locked || student.exam_status === "completed") {
    return json(403, { ok: false, error: "exam_already_completed" });
  }

  // Mark as in_progress (only if not already)
  if (student.exam_status === "not_attempted") {
    await supabase
      .from("students")
      .update({ exam_status: "in_progress" })
      .eq("id", student.id);
  }

  // @ts-ignore — joined relations
  const centerName = student.centers?.name ?? null;
  // @ts-ignore
  const courseName = student.courses?.name ?? null;

  return json(200, {
    ok: true,
    student: {
      enrollment_id,
      full_name: student.name,
      email: student.email,
      phone: student.phone,
      center_id: student.center_id,
      center_name: centerName,
      course_id: student.course_id,
      course_name: courseName,
    },
  });
});