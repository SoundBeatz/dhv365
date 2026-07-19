import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.hostname === "www.dhv365.nl") {
    const canonical = request.nextUrl.clone();
    canonical.hostname = "dhv365.nl";
    canonical.port = "";
    canonical.protocol = "https:";
    return NextResponse.redirect(canonical, 308);
  }
  const isPortalRoute = request.nextUrl.pathname.startsWith("/portal");
  if (!isPortalRoute) return NextResponse.next();

  const { response, userId } = await updateSession(request);
  if (isPortalRoute && !userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
