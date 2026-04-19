import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const EXAM_PORTAL_URL = "https://mjewqdginfurpujyvmds.supabase.co/functions/v1/list-exams";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("EXAM_PORTAL_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "EXAM_PORTAL_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active") === "true";
    const target = activeOnly ? `${EXAM_PORTAL_URL}?active=true` : EXAM_PORTAL_URL;

    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error("Exam portal upstream error", upstream.status, text);
      return new Response(
        JSON.stringify({ error: `Exam portal returned ${upstream.status}`, detail: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("list-exam-portal-exams failed", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
