import "server-only";
import { getDb } from "@/server/db/client";
import { hashPassword, verifyPassword } from "./password";

export type LoginResult =
  | { ok: true; userId: string }
  | {
      ok: false;
      reason:
        | "invalid_credentials"
        | "verification_required"
        | "account_suspended";
    };

let dummyHash: Promise<string> | undefined;
// Verified when the account doesn't exist, so response time doesn't reveal that.
const getDummyHash = () =>
  (dummyHash ??= hashPassword("timing-equalizer-not-a-real-password"));

export async function checkCredentials(
  emailNormalized: string,
  password: string,
): Promise<LoginResult> {
  const user = await getDb().user.findUnique({
    where: { emailNormalized },
    select: {
      id: true,
      status: true,
      credential: { select: { passwordHash: true } },
    },
  });

  const hash = user?.credential?.passwordHash ?? (await getDummyHash());
  const valid = await verifyPassword(hash, password);
  if (!user || !user.credential || !valid) {
    return { ok: false, reason: "invalid_credentials" };
  }
  if (user.status === "pending_verification")
    return { ok: false, reason: "verification_required" };
  if (user.status === "suspended")
    return { ok: false, reason: "account_suspended" };
  return { ok: true, userId: user.id };
}
