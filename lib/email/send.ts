import "server-only";
import { Resend } from "resend";
import { emailConfig } from "./config";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

export async function sendEmail(input: SendEmailInput) {
  const resend = new Resend(emailConfig.apiKey);
  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  if (recipients.length === 0 || recipients.some((recipient) => !recipient.includes("@"))) {
    throw new Error("A valid email recipient is required");
  }

  const { data, error } = await resend.emails.send({
    from: emailConfig.from,
    to: recipients,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo ?? emailConfig.replyTo,
    tags: input.tags,
  });

  if (error) {
    console.error("DHV365 email delivery failed", {
      name: error.name,
      message: error.message,
      recipients,
      subject: input.subject,
    });
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  console.info("DHV365 email accepted", {
    id: data?.id,
    recipients,
    subject: input.subject,
  });

  return data;
}
