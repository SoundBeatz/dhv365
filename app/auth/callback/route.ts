import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedRedirectPaths = ["/portal", "/update-password", "/login"];

function getSafeRedirectPath(requestedNext: string) {
  const isAllowed = allowedRedirectPaths.some(
    (path) =>
      requestedNext === path ||
      requestedNext.startsWith(`${path}/`) ||
      requestedNext.startsWith(`${path}?`),
  );

  return isAllowed ? requestedNext : "/portal";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/portal";
  const safeNext = getSafeRedirectPath(requestedNext);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Verificatielink+is+ongeldig+of+verlopen", url.origin),
  );
}
