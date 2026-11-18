import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAuthCookies,
} from "@/server/auth/cookies";
import { rotateRefreshToken } from "@/server/auth/sessions";
import { logError } from "@/server/http/log";
import { getClientIp } from "@/server/http/request";
import { enforceRateLimits } from "@/server/security/limits";

function go(path: string) {
  return NextResponse.redirect(new URL(path, siteConfig.url));
}

function safeNext(value: string | null): string {
  // Internal dashboard paths only (blocks open redirects like //evil.com).
  if (!value || !value.startsWith("/dashboard") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export async function GET(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && !["same-origin", "same-site", "none"].includes(site)) {
    return go("/login?_r=1");
  }

  const next = safeNext(new URL(request.url).searchParams.get("next"));
  const ip = getClientIp(request.headers);
  const limited = await enforceRateLimits([
    { key: `renew:ip:${ip}`, limit: 60, windowSeconds: 900 },
  ]);
  if (limited) return go("/login?_r=1");

  const token = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!token) return go("/login?_r=1");

  try {
    const result = await rotateRefreshToken(token);
    if (result.ok) {
      await setAuthCookies(result.tokens);
      return go(next);
    }
    if (result.reason === "concurrent") return go(next); // sibling just set fresh cookies
    await clearAuthCookies();
    return go("/login?_r=1");
  } catch (error) {
    logError("auth.renew", error);
    return go("/login?_r=1");
  }
}
