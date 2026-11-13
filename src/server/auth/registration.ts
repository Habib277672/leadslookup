import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/server/db/client";
import {
  getEmailService,
  type EmailService,
} from "@/server/email/email-service";
import {
  accountExistsEmail,
  verificationEmail,
} from "@/server/email/templates";
import { authConfig } from "./config";
import { hashPassword } from "./password";
import { generateOpaqueToken, hashToken } from "./tokens";

export type RegisterInput = {
  displayName: string;
  email: string;
  emailNormalized: string;
  password: string;
};
type Deps = { email?: EmailService };

const TX = { timeout: 15_000, maxWait: 10_000 } as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/** Invalidates older unused tokens, then creates a fresh one. Returns the raw token. */
async function issueVerificationToken(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<string> {
  const now = new Date();
  await tx.emailVerificationToken.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: now },
  });
  const raw = generateOpaqueToken();
  await tx.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(
        now.getTime() + authConfig.emailVerificationTtlSeconds * 1000,
      ),
    },
  });
  return raw;
}

/**
 * Callers must give the same public response for every outcome. Existing
 * addresses are never revealed.
 */
export async function registerUser(
  input: RegisterInput,
  deps: Deps = {},
  retried = false,
): Promise<void> {
  const db = getDb();
  const email = deps.email ?? getEmailService();
  // Hash in every branch so response timing does not reveal whether the email exists.
  const passwordHash = await hashPassword(input.password);

  const existing = await db.user.findUnique({
    where: { emailNormalized: input.emailNormalized },
    select: { id: true, status: true },
  });

  if (existing && existing.status !== "pending_verification") {
    if (existing.status === "active") {
      await email.send(accountExistsEmail({ to: input.email }));
    }
    return;
  }

  let token: string;
  try {
    token = await db.$transaction(async (tx) => {
      let userId: string;
      if (existing) {
        // Pending account: the latest registrant wins, so an earlier squatter's password is dropped.
        userId = existing.id;
        await tx.user.update({
          where: { id: userId },
          data: { displayName: input.displayName, email: input.email },
        });
        await tx.userCredential.upsert({
          where: { userId },
          create: { userId, passwordHash },
          update: { passwordHash, passwordUpdatedAt: new Date() },
        });
      } else {
        const user = await tx.user.create({
          data: {
            email: input.email,
            emailNormalized: input.emailNormalized,
            displayName: input.displayName,
            credential: { create: { passwordHash } },
          },
        });
        userId = user.id;
      }
      return issueVerificationToken(tx, userId);
    }, TX);
  } catch (error) {
    // Two simultaneous first registrations: let the loser take the "existing" path.
    if (isUniqueViolation(error) && !retried) {
      return registerUser(input, deps, true);
    }
    throw error;
  }

  await email.send(
    verificationEmail({
      to: input.email,
      displayName: input.displayName,
      token,
    }),
  );
}

export type ConfirmResult = { ok: true; userId: string } | { ok: false };

/**
 * Atomically consumes a verification token and activates the account.
 * The token is single-use; a failed attempt reveals nothing about why.
 */
export async function confirmEmailVerification(
  rawToken: string,
): Promise<ConfirmResult> {
  if (rawToken.length < 20 || rawToken.length > 200) return { ok: false };

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  return getDb().$transaction(async (tx): Promise<ConfirmResult> => {
    const consumed = await tx.emailVerificationToken.updateMany({
      where: { tokenHash, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (consumed.count !== 1) return { ok: false };

    const row = await tx.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });
    if (!row) return { ok: false };

    // Only a pending account is activated. Suspended or already-active accounts burn the token and get no session.
    const activated = await tx.user.updateMany({
      where: { id: row.userId, status: "pending_verification" },
      data: { status: "active", emailVerifiedAt: now },
    });
    if (activated.count !== 1) return { ok: false };

    return { ok: true, userId: row.userId };
  }, TX);
}

/** Same public response whether or not the address exists. */
export async function resendVerification(
  emailNormalized: string,
  deps: Deps = {},
): Promise<void> {
  const db = getDb();
  const user = await db.user.findUnique({
    where: { emailNormalized },
    select: { id: true, email: true, displayName: true, status: true },
  });
  if (!user || user.status !== "pending_verification") return;

  const token = await db.$transaction(
    (tx) => issueVerificationToken(tx, user.id),
    TX,
  );
  const email = deps.email ?? getEmailService();
  await email.send(
    verificationEmail({
      to: user.email,
      displayName: user.displayName ?? "there",
      token,
    }),
  );
}
