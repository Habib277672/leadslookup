import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";

const url = process.env.DATABASE_URL;
const tag = randomUUID();
const email = (name: string) => `${name}-${tag}@example.test`;
const future = () => new Date(Date.now() + 60 * 60 * 1000);

// Runs only when a database is configured (skipped in CI for now).
describe.skipIf(!url)("auth schema constraints", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url }),
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { emailNormalized: { endsWith: `-${tag}@example.test` } },
    });
    await prisma.$disconnect();
  });

  it("rejects two users with the same normalized email", async () => {
    const e = email("dup");
    await prisma.user.create({ data: { email: e, emailNormalized: e } });
    await expect(
      prisma.user.create({ data: { email: e, emailNormalized: e } }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects the same Google subject linked twice", async () => {
    const a = await prisma.user.create({
      data: { email: email("a"), emailNormalized: email("a") },
    });
    const b = await prisma.user.create({
      data: { email: email("b"), emailNormalized: email("b") },
    });
    const sub = randomUUID();
    await prisma.userIdentity.create({
      data: { userId: a.id, provider: "google", providerUserId: sub },
    });
    await expect(
      prisma.userIdentity.create({
        data: { userId: b.id, provider: "google", providerUserId: sub },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("deletes credentials, sessions and tokens with the user", async () => {
    const e = email("cascade");
    const jti = randomUUID();
    const user = await prisma.user.create({
      data: {
        email: e,
        emailNormalized: e,
        credential: { create: { passwordHash: "test-hash" } },
        verificationTokens: {
          create: { tokenHash: randomUUID(), expiresAt: future() },
        },
        sessions: {
          create: {
            expiresAt: future(),
            refreshTokens: {
              create: { jti, tokenHash: randomUUID(), expiresAt: future() },
            },
          },
        },
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(
      await prisma.userCredential.count({ where: { userId: user.id } }),
    ).toBe(0);
    expect(
      await prisma.emailVerificationToken.count({ where: { userId: user.id } }),
    ).toBe(0);
    expect(await prisma.authSession.count({ where: { userId: user.id } })).toBe(
      0,
    );
    expect(await prisma.authRefreshToken.count({ where: { jti } })).toBe(0);
  });
});
