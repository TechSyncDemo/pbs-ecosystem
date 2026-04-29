import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const secret = Deno.env.get("ECOSYSTEM_WEBHOOK_SECRET");
  if (!secret) return json(500, { ok: false, error: "secret_not_configured" });

  const rawBody = await req.text();
  const provided = (req.headers.get("x-signature") ?? "").trim().toLowerCase();
  const expected = await hmacSha256Hex(secret, rawBody);

  if (!provided || !timingSafeEqualHex(expected, provided)) {
    return json(401, { ok: false, error: "invalid_signature" });
  }

  let payload: {
    enrollment_id?: string;
    exam_id?: string;
    exam_title?: string;
    status?: string;
    completed_at?: string;
    attempt_id?: string;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const enrollment_id = (payload.enrollment_id ?? "").trim();
  const attempt_id = (payload.attempt_id ?? "").trim();
  if (!enrollment_id || !attempt_id) {
    return json(400, { ok: false, error: "missing_fields" });
  }

  const completed_at = payload.completed_at ? new Date(payload.completed_at) : new Date();
  if (isNaN(completed_at.getTime())) {
    return json(400, { ok: false, error: "invalid_completed_at" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: student, error: lookupErr } = await supabase
    .from("students")
    .select("id")
    .eq("enrollment_no", enrollment_id)
    .maybeSingle();

  if (lookupErr) {
    console.error("webhook lookup error", lookupErr);
    return json(500, { ok: false, error: "lookup_failed" });
  }
  if (!student) return json(404, { ok: false, error: "student_not_found" });

  // Idempotent insert into exam_history
  const { error: histErr } = await supabase.from("exam_history").upsert(
    {
      student_id: student.id,
      exam_id: payload.exam_id ?? null,
      exam_title: payload.exam_title ?? null,
      completed_at: completed_at.toISOString(),
      external_attempt_id: attempt_id,
      raw_payload: payload as unknown as Record<string, unknown>,
    },
    { onConflict: "student_id,external_attempt_id", ignoreDuplicates: false }
  );

  if (histErr) {
    console.error("exam_history upsert error", histErr);
    return json(500, { ok: false, error: "history_write_failed" });
  }

  // Lock the student record
  const { error: updErr } = await supabase
    .from("students")
    .update({
      exam_status: "completed",
      exam_completed_at: completed_at.toISOString(),
      exam_locked: true,
    })
    .eq("id", student.id);

  if (updErr) {
    console.error("student lock update error", updErr);
    return json(500, { ok: false, error: "student_update_failed" });
  }

  return json(200, { ok: true });
});