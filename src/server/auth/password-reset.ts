import "server-only";
import { getDb } from "@/server/db/client";
import {
  getEmailService,
  type EmailService,
} from "@/server/email/email-service";
import {
  passwordChangedEmail,
  passwordResetEmail,
} from "@/server/email/templates";
import { logError } from "@/server/http/log";
import { authConfig } from "./config";
import { hashPassword } from "./password";
import { generateOpaqueToken, hashToken } from "./tokens";

type Deps = { email?: EmailService };
const TX = { timeout: 15_000, maxWait: 10_000 } as const;

/**
 * Creates a reset token and emails it, only for active accounts.
 * Callers must give the same public response for every outcome.
 */
export async function requestPasswordReset(
  emailNormalized: string,
  deps: Deps = {},
): Promise<void> {
  const db = getDb();
  const user = await db.user.findUnique({
    where: { emailNormalized },
    select: { id: true, email: true, displayName: true, status: true },
  });
  if (!user || user.status !== "active") return;

  const raw = generateOpaqueToken();
  const now = new Date();
  await db.$transaction(async (tx) => {
    // A new request invalidates older unused links.
    await tx.passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: now },
    });
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(
          now.getTime() + authConfig.passwordResetTtlSeconds * 1000,
        ),
      },
    });
  }, TX);

  const email = deps.email ?? getEmailService();
  await email.send(
    passwordResetEmail({
      to: user.email,
      displayName: user.displayName ?? "there",
      token: raw,
    }),
  );
}

export type ResetResult = { ok: true } | { ok: false };

/**
 * Consumes a reset token, sets the new password and revokes every session,
 * all in one transaction. Does not sign the user in.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
  deps: Deps = {},
): Promise<ResetResult> {
  if (rawToken.length < 20 || rawToken.length > 200) return { ok: false };

  const db = getDb();
  const passwordHash = await hashPassword(newPassword);
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const user = await db.$transaction(async (tx) => {
    // Only one caller can flip consumedAt from null; the rest lose the race.
    const consumed = await tx.passwordResetToken.updateMany({
      where: { tokenHash, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (consumed.count !== 1) return null;

    const row = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        user: { select: { email: true, displayName: true, status: true } },
      },
    });
    // A suspended account burns the token and gets nothing.
    if (!row || row.user.status !== "active") return null;
    const { userId } = row;

    await tx.userCredential.upsert({
      where: { userId },
      create: { userId, passwordHash },
      update: { passwordHash, passwordUpdatedAt: now },
    });
    await tx.passwordResetToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: now },
    });
    await tx.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.authRefreshToken.updateMany({
      where: { session: { userId }, revokedAt: null },
      data: { revokedAt: now },
    });
    return row.user;
  }, TX);

  if (!user) return { ok: false };

  try {
    const email = deps.email ?? getEmailService();
    await email.send(
      passwordChangedEmail({
        to: user.email,
        displayName: user.displayName ?? "there",
      }),
    );
  } catch (error) {
    // The password is already changed; a failed notice must not turn that into an error.
    logError("auth.reset.notice", error);
  }
  return { ok: true };
}
