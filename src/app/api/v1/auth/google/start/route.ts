import { NextResponse, connection } from "next/server";
import { siteConfig } from "@/config/site";
import {
  buildAuthorizationUrl,
  createFlowSecrets,
  getGoogleConfig,
} from "@/server/auth/google";
import { setFlowCookie } from "@/server/auth/oauth-flow";
import { logError } from "@/server/http/log";
import { getClientIp } from "@/server/http/request";
import { enforceRateLimits } from "@/server/security/limits";

const toLogin = (code: string) =>
  NextResponse.redirect(new URL(`/login?error=${code}`, siteConfig.url));

export async function GET(request: Request) {
  await connection();

  const config = getGoogleConfig();
  if (!config) return toLogin("google_unavailable");

  const limited = await enforceRateLimits([
    {
      key: `google:start:ip:${getClientIp(request.headers)}`,
      limit: 30,
      windowSeconds: 900,
    },
  ]);
  if (limited) return toLogin("rate_limited");

  try {
    const secrets = createFlowSecrets();
    await setFlowCookie({
      state: secrets.state,
      nonce: secrets.nonce,
      codeVerifier: secrets.codeVerifier,
    });
    return NextResponse.redirect(
      buildAuthorizationUrl({
        clientId: config.clientId,
        state: secrets.state,
        nonce: secrets.nonce,
        codeChallenge: secrets.codeChallenge,
      }),
    );
  } catch (error) {
    logError("auth.google.start", error);
    return toLogin("google_failed");
  }
}
