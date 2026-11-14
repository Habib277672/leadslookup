import "server-only";
import { normalizeEmail } from "@/features/auth/schemas";
import { getDb } from "@/server/db/client";
import { isUniqueViolation } from "@/server/db/errors";
import type { GoogleProfile } from "./google";

export type GoogleSignInResult =
  | { ok: true; userId: string; created: boolean }
  | { ok: false; reason: "email_in_use" | "suspended" };

const TX = { timeout: 15_000, maxWait: 10_000 } as const;

const displayNameFor = (profile: GoogleProfile) =>
  (profile.name ?? profile.email.split("@")[0] ?? "").trim().slice(0, 80) ||
  null;

/**
 * Finds or creates the account for a verified Google identity.
 * - Identity is the stable Google `sub`, never the email.
 * - An existing active or suspended account with the same email is NOT merged.
 * - An unverified pending account is deleted: nobody proved ownership of that
 *   address, and Google just did. This also kills a squatter's password.
 */
export async function resolveGoogleUser(
  profile: GoogleProfile,
  retried = false,
): Promise<GoogleSignInResult> {
  const db = getDb();

  const identity = await db.userIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider: "google",
        providerUserId: profile.sub,
      },
    },
    select: { id: true, user: { select: { id: true, status: true } } },
  });
  if (identity) {
    if (identity.user.status !== "active")
      return { ok: false, reason: "suspended" };
    await db.userIdentity.update({
      where: { id: identity.id },
      data: { email: profile.email, emailVerified: true },
    });
    return { ok: true, userId: identity.user.id, created: false };
  }

  const emailNormalized = normalizeEmail(profile.email);
  try {
    return await db.$transaction(async (tx): Promise<GoogleSignInResult> => {
      const existing = await tx.user.findUnique({
        where: { emailNormalized },
        select: { id: true, status: true },
      });
      if (existing && existing.status !== "pending_verification") {
        return { ok: false, reason: "email_in_use" };
      }
      if (existing) await tx.user.delete({ where: { id: existing.id } });

      const now = new Date();
      const user = await tx.user.create({
        data: {
          email: profile.email,
          emailNormalized,
          displayName: displayNameFor(profile),
          status: "active",
          emailVerifiedAt: now,
          identities: {
            create: {
              provider: "google",
              providerUserId: profile.sub,
              email: profile.email,
              emailVerified: true,
              verifiedAt: now,
            },
          },
        },
        select: { id: true },
      });
      return { ok: true, userId: user.id, created: true };
    }, TX);
  } catch (error) {
    // Two simultaneous first sign-ins: the loser re-reads and finds the identity.
    if (isUniqueViolation(error) && !retried)
      return resolveGoogleUser(profile, true);
    throw error;
  }
}
