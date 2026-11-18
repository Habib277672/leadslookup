import { NextResponse, type NextRequest } from "next/server";

const production = process.env.NODE_ENV === "production";
const ACCESS_COOKIE = production ? "__Host-ll_at" : "ll_at";
const HINT_COOKIE = production ? "__Host-ll_s" : "ll_s";

const ENTRY_PATHS = new Set(["/", "/login", "/register"]);

// Convenience routing only. Pages and API routes still verify the user themselves.
export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const hasAccess = request.cookies.has(ACCESS_COOKIE);
  const hasHint = request.cookies.has(HINT_COOKIE);
  const triedRenew = searchParams.has("_r");

  const renewTo = (target: string) => {
    const renew = new URL("/api/v1/auth/session/renew", request.url);
    renew.searchParams.set("next", target);
    return NextResponse.redirect(renew);
  };

  // Public entry pages: signed-in visitors go straight to the dashboard.
  if (ENTRY_PATHS.has(pathname)) {
    if (triedRenew) return NextResponse.next();
    if (hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (hasHint) return renewTo("/dashboard?_r=1");
    return NextResponse.next();
  }

  // Dashboard: needs a session.
  if (hasAccess) return NextResponse.next();
  if (triedRenew || !hasHint) {
    return NextResponse.redirect(new URL("/login?_r=1", request.url));
  }
  return renewTo(`${pathname}${search}${search ? "&" : "?"}_r=1`);
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*"],
};
