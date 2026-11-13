import "server-only";
import { cookies } from "next/headers";
import { authenticateAccessToken, type CurrentUser } from "./authenticate";
import { ACCESS_COOKIE } from "./cookies";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  return authenticateAccessToken(store.get(ACCESS_COOKIE)?.value);
}
