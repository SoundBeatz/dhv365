import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      application: "DHV365",
      authFlow: "login-reset-v2",
      expectedRecoveryRedirect: "https://dhv365.nl/login/?reset=1",
      buildMarker: "2026-07-19T21:30:00+02:00",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    },
  );
}
