import "server-only";
import { cookies } from "next/headers";
import { authConfig } from "./config";
import type { SessionTokens } from "./sessions";

const production = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE = production ? "__Host-ll_at" : "ll_at";
export const REFRESH_COOKIE = production ? "__Secure-ll_rt" : "ll_rt";
const REFRESH_PATH = "/api/v1/auth";

export async function setAuthCookies(tokens: SessionTokens): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
    maxAge: authConfig.accessTtlSeconds,
  });
  store.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: REFRESH_PATH,
    expires: tokens.refreshExpiresAt,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  store.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: REFRESH_PATH,
    maxAge: 0,
  });
}
