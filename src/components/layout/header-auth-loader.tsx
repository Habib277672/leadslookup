import { cookies } from "next/headers";
import { connection } from "next/server";
import { HeaderAuth } from "@/components/layout/header-auth";
import { SESSION_HINT_COOKIE } from "@/server/auth/cookies";

/** Presence check only: the page itself never trusts this, and /dashboard verifies for real. */
export async function HeaderAuthLoader() {
  await connection();
  const signedIn = (await cookies()).has(SESSION_HINT_COOKIE);
  return <HeaderAuth signedIn={signedIn} />;
}
