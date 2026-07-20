import { createClient } from "npm:@supabase/supabase-js@2";

const allowedTemplates = new Set([
  "system.test",
  "account.welcome",
  "account.password_changed",
  "account.login_alert",
  "contact.received",
]);

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

function validEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
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

    const body = await request.json() as {
      templateKey?: string;
      recipientEmail?: string;
      recipientName?: string;
      payload?: Record<string, unknown>;
      priority?: number;
      scheduledAt?: string;
      maxAttempts?: number;
    };

    const templateKey = body.templateKey?.trim() ?? "";
    const recipientEmail = body.recipientEmail?.trim().toLowerCase() ?? "";
    if (!allowedTemplates.has(templateKey)) {
      return new Response(JSON.stringify({ ok: false, error: "Unsupported template" }), { status: 400, headers: jsonHeaders });
    }
    if (!validEmail(recipientEmail)) {
      return new Response(JSON.stringify({ ok: false, error: "Valid recipientEmail required" }), { status: 400, headers: jsonHeaders });
    }
    if (body.payload !== undefined && (body.payload === null || Array.isArray(body.payload) || typeof body.payload !== "object")) {
      return new Response(JSON.stringify({ ok: false, error: "payload must be an object" }), { status: 400, headers: jsonHeaders });
    }

    const priority = Number.isInteger(body.priority) ? Number(body.priority) : 100;
    const maxAttempts = Number.isInteger(body.maxAttempts) ? Number(body.maxAttempts) : 3;
    if (priority < 1 || priority > 1000 || maxAttempts < 1 || maxAttempts > 10) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid priority or maxAttempts" }), { status: 400, headers: jsonHeaders });
    }

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : new Date();
    if (Number.isNaN(scheduledAt.getTime())) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid scheduledAt" }), { status: 400, headers: jsonHeaders });
    }

    const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("email_jobs")
      .insert({
        template_key: templateKey,
        recipient_email: recipientEmail,
        recipient_name: body.recipientName?.trim() || null,
        payload: body.payload ?? {},
        priority,
        scheduled_at: scheduledAt.toISOString(),
        max_attempts: maxAttempts,
      })
      .select("id, status, scheduled_at")
      .single();

    if (error) throw new Error(`Unable to enqueue email: ${error.message}`);

    return new Response(JSON.stringify({ ok: true, job: data }), { status: 201, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown enqueue error";
    console.error("DHV365 email enqueue failed", { message });
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: jsonHeaders });
  }
});
