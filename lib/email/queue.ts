import "server-only";

export type QueueEmailInput = {
  to: string;
  templateKey: string;
  payload: Record<string, unknown>;
  recipientName?: string;
  priority?: number;
  scheduledAt?: string;
  maxAttempts?: number;
};

type QueueEmailResponse = {
  ok: boolean;
  jobId?: string;
  error?: string;
};

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function queueEmail(input: QueueEmailInput): Promise<string> {
  const projectRef = requiredEnvironment("SUPABASE_PROJECT_REF");
  const webhookSecret = requiredEnvironment("EMAIL_WEBHOOK_SECRET");

  const response = await fetch(
    `https://${projectRef}.supabase.co/functions/v1/email-enqueue`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-email-webhook-secret": webhookSecret,
      },
      body: JSON.stringify({
        to: input.to.trim().toLowerCase(),
        recipientName: input.recipientName?.trim() || undefined,
        templateKey: input.templateKey,
        payload: input.payload,
        priority: input.priority ?? 100,
        scheduledAt: input.scheduledAt,
        maxAttempts: input.maxAttempts ?? 3,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  const result = (await response.json().catch(() => null)) as QueueEmailResponse | null;

  if (!response.ok || !result?.ok || !result.jobId) {
    console.error("DHV365 email queue request failed", {
      status: response.status,
      templateKey: input.templateKey,
      error: result?.error ?? "Invalid queue response",
    });
    throw new Error("Transactional email could not be queued");
  }

  return result.jobId;
}
