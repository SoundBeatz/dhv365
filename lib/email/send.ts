import "server-only";
import { emailConfig } from "./config";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

type ResendResponse = { id?: string; message?: string; name?: string };

export async function sendEmail(input: SendEmailInput) {
  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  if (recipients.length === 0 || recipients.some((recipient) => !/^\S+@\S+\.\S+$/.test(recipient))) {
    throw new Error("A valid email recipient is required");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${emailConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailConfig.from,
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo ?? emailConfig.replyTo,
      tags: input.tags,
    }),
    cache: "no-store",
  });

  const result = (await response.json()) as ResendResponse;

  if (!response.ok) {
    console.error("DHV365 email delivery failed", {
      status: response.status,
      message: result.message,
      recipients,
      subject: input.subject,
    });
    throw new Error(`Email delivery failed: ${result.message ?? response.statusText}`);
  }

  console.info("DHV365 email accepted", {
    id: result.id,
    recipients,
    subject: input.subject,
  });

  return result;
}
