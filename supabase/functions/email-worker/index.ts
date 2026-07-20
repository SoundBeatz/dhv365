import { createClient } from "npm:@supabase/supabase-js@2";
import { renderTemplate } from "../_shared/email-templates.ts";

type EmailJob = {
  id: string;
  template_key: string;
  recipient_email: string;
  recipient_name: string | null;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

type ResendResponse = {
  id?: string;
  message?: string;
};

const jsonHeaders = { "Content-Type": "application/json" };

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function secureEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function sendWithResend(job: EmailJob): Promise<string> {
  const resendApiKey = requiredEnv("RESEND_API_KEY");
  const from = requiredEnv("EMAIL_FROM");
  const replyTo = Deno.env.get("EMAIL_REPLY_TO") ?? "account@dhv365.nl";
  const template = renderTemplate(job.template_key, job.payload ?? {});

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `dhv365-email-job-${job.id}`,
    },
    body: JSON.stringify({
      from,
      to: [job.recipient_email],
      subject: template.subject,
      html: template.html,
      text: template.text,
      reply_to: replyTo,
      tags: [
        { name: "system", value: "dhv365" },
        { name: "template", value: job.template_key.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 50) },
      ],
    }),
  });

  const body = await response.json() as ResendResponse;
  if (!response.ok || !body.id) {
    throw new Error(`Resend rejected email: ${body.message ?? response.statusText}`);
  }

  return body.id;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...jsonHeaders, Allow: "POST" },
    });
  }

  try {
    const configuredSecret = requiredEnv("EMAIL_WEBHOOK_SECRET");
    const suppliedSecret = request.headers.get("x-email-webhook-secret") ?? "";
    if (!secureEquals(configuredSecret, suppliedSecret)) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let batchSize = 10;
    try {
      const body = await request.json() as { batchSize?: number };
      if (Number.isInteger(body.batchSize) && Number(body.batchSize) >= 1 && Number(body.batchSize) <= 50) {
        batchSize = Number(body.batchSize);
      }
    } catch {
      // An empty request body is valid and uses the default batch size.
    }

    const workerId = `email-worker:${Deno.env.get("SB_EXECUTION_ID") ?? crypto.randomUUID()}`;
    const { data, error } = await supabase.rpc("claim_email_jobs", {
      worker_id: workerId,
      batch_size: batchSize,
    });

    if (error) throw new Error(`Unable to claim email jobs: ${error.message}`);

    const jobs = (data ?? []) as EmailJob[];
    const results: Array<{ id: string; status: "sent" | "failed"; providerId?: string; error?: string }> = [];

    for (const job of jobs) {
      try {
        const providerId = await sendWithResend(job);
        const { error: completeError } = await supabase.rpc("complete_email_job", {
          job_id: job.id,
          worker_id: workerId,
          provider_id: providerId,
        });
        if (completeError) throw new Error(`Unable to complete email job: ${completeError.message}`);
        results.push({ id: job.id, status: "sent", providerId });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email delivery error";
        const retryDelaySeconds = Math.min(3600, 60 * Math.max(1, 2 ** Math.max(0, job.attempts - 1)));
        const { error: failError } = await supabase.rpc("fail_email_job", {
          job_id: job.id,
          worker_id: workerId,
          error_message: message,
          retry_delay_seconds: retryDelaySeconds,
        });
        if (failError) console.error("Unable to mark email job as failed", { jobId: job.id, error: failError.message });
        results.push({ id: job.id, status: "failed", error: message });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      claimed: jobs.length,
      sent: results.filter((result) => result.status === "sent").length,
      failed: results.filter((result) => result.status === "failed").length,
      results,
    }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    console.error("DHV365 email worker failed", { message });
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
