const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const emailConfig = {
  get apiKey() {
    return required("RESEND_API_KEY", process.env.RESEND_API_KEY);
  },
  from: process.env.EMAIL_FROM ?? "DHV365 Account Service <account@dhv365.nl>",
  replyTo: process.env.EMAIL_REPLY_TO ?? "account@dhv365.nl",
  admin: process.env.EMAIL_ADMIN ?? "account@dhv365.nl",
  appUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dhv365.nl",
};

export function getEmailConfigStatus() {
  return {
    resendApiKey: Boolean(process.env.RESEND_API_KEY),
    from: emailConfig.from,
    replyTo: emailConfig.replyTo,
    admin: emailConfig.admin,
    appUrl: emailConfig.appUrl,
  };
}
