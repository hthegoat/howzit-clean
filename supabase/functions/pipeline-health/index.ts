import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Grades the pipeline (check_pipeline_health() in SQL holds every threshold)
// and pushes an alert when something fails or changes state. Runs at 07:00
// and 19:00 UTC. The full picture is always at https://hwztsurf.com/status

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_URL = "https://hwztsurf.com/status";

// ---- Run log (pipeline_runs, read by /status). Keep in sync across functions.
async function startRun(sb: SupabaseClient, job: string, batch: string | null) {
  const { data } = await sb.from("pipeline_runs").insert({ job, batch }).select("id").single();
  return (data?.id as string) ?? null;
}
async function finishRun(sb: SupabaseClient, id: string | null, f: {
  status: "ok" | "partial" | "error"; processed?: number; failed?: number; error?: string | null; summary?: unknown;
}) {
  if (!id) return;
  await sb.from("pipeline_runs").update({
    finished_at: new Date().toISOString(),
    status: f.status, processed: f.processed ?? null, failed: f.failed ?? null,
    error: f.error ? String(f.error).slice(0, 500) : null, summary: f.summary ?? null,
  }).eq("id", id);
}

interface Check {
  check_name: string;
  status: "ok" | "warn" | "fail";
  observed: number;
  expected: number;
  detail: string;
}

// Alert on any failure, and once when a check CHANGES state. A warning that
// has sat there for a week is not news, and a monitor that pings every day is
// one you learn to ignore.
function shouldAlert(current: Check[], previous: Record<string, string>): boolean {
  if (current.some(c => c.status === "fail")) return true;
  return current.some(c => previous[c.check_name] && previous[c.check_name] !== c.status);
}

function buildMessage(current: Check[], previous: Record<string, string>): { subject: string; body: string } {
  const fails = current.filter(c => c.status === "fail");
  const warns = current.filter(c => c.status === "warn");

  const subject = fails.length
    ? `Howzit: ${fails.length} pipeline check${fails.length > 1 ? "s" : ""} failing`
    : warns.length
      ? `Howzit: pipeline warning`
      : `Howzit: pipeline recovered`;

  const icon = (s: string) => (s === "fail" ? "[FAIL]" : s === "warn" ? "[WARN]" : "[ ok ]");

  const lines = current.map(c => {
    const was = previous[c.check_name];
    const changed = was && was !== c.status ? `  (was ${was})` : "";
    const pct = c.expected ? Math.round((c.observed / c.expected) * 100) : 100;
    return `${icon(c.status)} ${c.check_name.padEnd(20)} ${c.observed}/${c.expected} (${pct}%)${changed}\n         ${c.detail}`;
  });

  const body = [
    subject,
    "",
    ...lines,
    "",
    `Details: ${STATUS_URL}`,
    `Checked at ${new Date().toISOString()}`
  ].join("\n");

  return { subject, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const runId = await startRun(supabase, "pipeline-health", null);

  try {
    const force = new URL(req.url).searchParams.get("force") === "1";

    // Snapshot of the previous run, to spot state changes
    const { data: priorRows } = await supabase
      .from("pipeline_health")
      .select("check_name, status, checked_at")
      .order("checked_at", { ascending: false })
      .limit(40);

    const priorRunAt = priorRows?.[0]?.checked_at ?? null;
    const previous: Record<string, string> = {};
    for (const r of priorRows ?? []) {
      if (r.checked_at === priorRunAt) previous[r.check_name] = r.status;
    }

    const { data: checks, error } = await supabase.rpc("check_pipeline_health");
    if (error) throw new Error(`Health check failed: ${error.message}`);

    const current = (checks ?? []) as Check[];
    const alerting = force || shouldAlert(current, previous);
    const { subject, body } = buildMessage(current, previous);

    const delivered: string[] = [];
    const deliveryErrors: string[] = [];

    if (alerting) {
      // Discord reads `content`, Slack reads `text`; sending both means one
      // webhook URL works for either.
      const webhook = Deno.env.get("ALERT_WEBHOOK_URL");
      if (webhook) {
        try {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: "```\n" + body.slice(0, 1900) + "\n```", text: body }),
            signal: AbortSignal.timeout(10_000),
          });
          res.ok ? delivered.push("webhook") : deliveryErrors.push(`webhook HTTP ${res.status}`);
        } catch (e) {
          deliveryErrors.push(`webhook: ${e instanceof Error ? e.message : "failed"}`);
        }
      }

      const resendKey = Deno.env.get("RESEND_API_KEY");
      const to = Deno.env.get("ALERT_EMAIL");
      if (resendKey && to) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: Deno.env.get("ALERT_FROM") ?? "Howzit Monitor <onboarding@resend.dev>",
              to: [to],
              subject,
              text: body
            }),
            signal: AbortSignal.timeout(10_000),
          });
          res.ok ? delivered.push("email") : deliveryErrors.push(`resend HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
        } catch (e) {
          deliveryErrors.push(`resend: ${e instanceof Error ? e.message : "failed"}`);
        }
      }

      if (!webhook && !(resendKey && to)) {
        deliveryErrors.push("No alert channel configured (set ALERT_WEBHOOK_URL, or RESEND_API_KEY + ALERT_EMAIL)");
      }
    }

    const failing = current.filter(c => c.status === "fail").map(c => c.check_name);
    const warning = current.filter(c => c.status === "warn").map(c => c.check_name);

    // The run itself is only an error if the alert could not be delivered
    await finishRun(supabase, runId, {
      status: alerting && !delivered.length ? "error" : "ok",
      processed: current.length,
      failed: failing.length,
      error: deliveryErrors[0] ?? null,
      summary: { alerting, delivered, failing, warning },
    });

    return new Response(JSON.stringify({
      alerting, delivered, delivery_errors: deliveryErrors, failing, warning, checks: current, message: body
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    await finishRun(supabase, runId, { status: "error", error: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
