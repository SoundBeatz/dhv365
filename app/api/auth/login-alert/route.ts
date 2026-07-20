import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queueEmail } from "@/lib/email/queue";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const name = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : user.email.split("@")[0];
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const details = `Tijdstip: ${new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}${forwardedFor ? ` · IP: ${forwardedFor}` : ""}`;

  try {
    await queueEmail({
      to: user.email,
      recipientName: name,
      templateKey: "account.login_alert",
      payload: { name, details },
      priority: 20,
    });
  } catch (error) {
    console.error("Unable to queue DHV365 login alert", {
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
