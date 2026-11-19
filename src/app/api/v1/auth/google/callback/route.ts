import { NextResponse, connection } from "next/server";
import { siteConfig } from "@/config/site";
import { setAuthCookies } from "@/server/auth/cookies";
import {
  exchangeCode,
  getGoogleConfig,
  verifyIdToken,
} from "@/server/auth/google";
import { resolveGoogleUser } from "@/server/auth/google-signin";
import { takeFlowCookie } from "@/server/auth/oauth-flow";
// import { createSession } from "@/server/auth/sessions";
import { startSession } from "@/server/auth/start-session";
import { safeEqualString } from "@/server/auth/tokens";
import { logError } from "@/server/http/log";
import { getClientIp } from "@/server/http/request";
import { enforceRateLimits } from "@/server/security/limits";

const toLogin = (code: string) =>
  NextResponse.redirect(new URL(`/login?error=${code}`, siteConfig.url));

export async function GET(request: Request) {
  await connection();

  const config = getGoogleConfig();
  if (!config) return toLogin("google_unavailable");

  const ip = getClientIp(request.headers);
  const limited = await enforceRateLimits([
    { key: `google:callback:ip:${ip}`, limit: 30, windowSeconds: 900 },
  ]);
  if (limited) return toLogin("rate_limited");

  // Always consumed, so a flow can never be replayed.
  const flow = await takeFlowCookie();
  if (!flow) return toLogin("google_failed");

  const params = new URL(request.url).searchParams;
  const error = params.get("error");
  if (error)
    return toLogin(
      error === "access_denied" ? "google_denied" : "google_failed",
    );

  const code = params.get("code");
  const state = params.get("state");
  if (
    !code ||
    code.length > 2048 ||
    !state ||
    !safeEqualString(state, flow.state)
  ) {
    return toLogin("google_failed");
  }

  try {
    const idToken = await exchangeCode({
      code,
      codeVerifier: flow.codeVerifier,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
    if (!idToken) return toLogin("google_failed");

    const profile = await verifyIdToken(idToken, {
      clientId: config.clientId,
      nonce: flow.nonce,
    });
    if (!profile) return toLogin("google_failed");

    const result = await resolveGoogleUser(profile);
    if (!result.ok) {
      return toLogin(
        result.reason === "email_in_use"
          ? "google_email_in_use"
          : "account_suspended",
      );
    }

    const tokens = await startSession(result.userId, {
      userAgent: request.headers.get("user-agent"),
      ipAddress: ip === "unknown" ? null : ip,
    });
    await setAuthCookies(tokens);
    return NextResponse.redirect(new URL("/dashboard", siteConfig.url));
  } catch (caught) {
    logError("auth.google.callback", caught);
    return toLogin("google_failed");
  }
}
