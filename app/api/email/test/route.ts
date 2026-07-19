import { NextRequest, NextResponse } from "next/server";
import { getEmailConfigStatus } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const configuredSecret = process.env.MAIL_TEST_SECRET;
  const suppliedSecret = request.headers.get("x-mail-test-secret");
  return Boolean(configuredSecret && suppliedSecret && configuredSecret === suppliedSecret);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, configuration: getEmailConfigStatus() });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }

    const template = emailTemplates.test(email);
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      tags: [{ name: "category", value: "system-test" }],
    });

    return NextResponse.json({ ok: true, id: result?.id ?? null });
  } catch (error) {
    console.error("Mail test endpoint failed", error);
    return NextResponse.json({ ok: false, error: "Mail delivery failed" }, { status: 500 });
  }
}
