import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { authenticateAccessToken, type CurrentUser } from "./authenticate";
import { ACCESS_COOKIE } from "./cookies";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Token expiry depends on the current time, so this must render per request,
  // never during prerendering. connection() has to come before any new Date().
  await connection();
  const store = await cookies();
  return authenticateAccessToken(store.get(ACCESS_COOKIE)?.value);
});
