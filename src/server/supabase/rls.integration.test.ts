import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authConfig } from "@/server/auth/config";
import { getKeys } from "@/server/auth/keys";
import { createSession } from "@/server/auth/sessions";
import { getDb } from "@/server/db/client";
import { createUserSupabaseClient } from "./user-client";

// Needs the real database, the real Supabase project, and tokens from the issuer Supabase trusts.
const configured = Boolean(
  process.env.DATABASE_URL &&
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_PUBLISHABLE_KEY &&
  process.env.AUTH_ISSUER?.startsWith("https://"),
);

const tag = randomUUID().slice(0, 8);
const addr = (name: string) => `${name}-${tag}@example.test`;

async function makeUser(name: string) {
  return getDb().user.create({
    data: {
      email: addr(name),
      emailNormalized: addr(name),
      displayName: `User ${name}`,
      status: "active",
      emailVerifiedAt: new Date(),
    },
  });
}

async function mintWithIssuer(userId: string, issuer: string) {
  const { privateKey, kid } = await getKeys();
  const iat = Math.floor(Date.now() / 1000);
  return new SignJWT({
    role: "authenticated",
    sid: randomUUID(),
    token_use: "access",
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(issuer)
    .setAudience("authenticated")
    .setSubject(userId)
    .setIssuedAt(iat)
    .setExpirationTime(iat + 300)
    .sign(privateKey);
}

describe.skipIf(!configured)(
  "users row-level security through the Supabase Data API",
  () => {
    let a: { id: string };
    let b: { id: string };
    let asA: ReturnType<typeof createUserSupabaseClient>;
    let asB: ReturnType<typeof createUserSupabaseClient>;

    beforeAll(async () => {
      a = await makeUser("alice");
      b = await makeUser("bob");
      asA = createUserSupabaseClient((await createSession(a.id)).accessToken);
      asB = createUserSupabaseClient((await createSession(b.id)).accessToken);
    });

    afterAll(async () => {
      const db = getDb();
      await db.user.deleteMany({
        where: { emailNormalized: { endsWith: `-${tag}@example.test` } },
      });
      await db.$disconnect();
    });

    it("lets a user read exactly their own row", async () => {
      const { data, error } = await asA
        .from("users")
        .select("id,email,display_name,role,status");
      expect(error).toBeNull();
      expect(data).toEqual([
        {
          id: a.id,
          email: addr("alice"),
          display_name: "User alice",
          role: "user",
          status: "active",
        },
      ]);
    });

    it("hides other users' rows, including when asked for by id", async () => {
      const byId = await asA.from("users").select("id").eq("id", b.id);
      expect(byId.error).toBeNull();
      expect(byId.data).toEqual([]);
      const all = await asB.from("users").select("id");
      expect(all.data).toEqual([{ id: b.id }]);
    });

    it("does not expose columns that were never granted", async () => {
      const { error } = await asA.from("users").select("email_normalized");
      expect(error?.code).toBe("42501");
      const secret = await asA.from("users").select("password_changed_at");
      expect(secret.error?.code).toBe("42501");
    });

    it("lets a user change their display name and theme, and updates updated_at", async () => {
      // Compare against the database clock: this machine's clock can differ by seconds.
      const rows = await getDb().$queryRaw<
        { now: Date }[]
      >`select now() as now`;
      const dbNow = rows[0]?.now;
      if (!dbNow) throw new Error("could not read the database time");

      const { data, error } = await asA
        .from("users")
        .update({ display_name: "Alice Renamed", theme_preference: "dark" })
        .eq("id", a.id)
        .select("display_name,theme_preference");
      expect(error).toBeNull();
      expect(data).toEqual([
        { display_name: "Alice Renamed", theme_preference: "dark" },
      ]);

      const after = await getDb().user.findUniqueOrThrow({
        where: { id: a.id },
      });
      expect(after.displayName).toBe("Alice Renamed");
      expect(after.themePreference).toBe("dark");
      // Stamped by the database trigger, not by Prisma or this machine.
      expect(after.updatedAt.getTime()).toBeGreaterThanOrEqual(dbNow.getTime());
    });

    it("refuses changes to role, status, email and id, and leaves the data untouched", async () => {
      for (const patch of [
        { role: "super_admin" },
        { status: "suspended" },
        { email: "stolen@example.test" },
        { id: randomUUID() },
        { email_verified_at: null },
      ]) {
        const { error } = await asB.from("users").update(patch).eq("id", b.id);
        expect(error?.code, JSON.stringify(patch)).toBe("42501");
      }
      const row = await getDb().user.findUniqueOrThrow({ where: { id: b.id } });
      expect(row.role).toBe("user");
      expect(row.status).toBe("active");
      expect(row.email).toBe(addr("bob"));
    });

    it("cannot change another user's row", async () => {
      const { data, error } = await asA
        .from("users")
        .update({ display_name: "Hacked" })
        .eq("id", b.id)
        .select("id");
      expect(error).toBeNull();
      expect(data).toEqual([]);
      expect(
        (await getDb().user.findUniqueOrThrow({ where: { id: b.id } }))
          .displayName,
      ).toBe("User bob");
    });

    it("enforces the display name length in the database", async () => {
      const tooLong = await asA
        .from("users")
        .update({ display_name: "x".repeat(81) })
        .eq("id", a.id);
      expect(tooLong.error).not.toBeNull();
      const empty = await asA
        .from("users")
        .update({ display_name: "" })
        .eq("id", a.id);
      expect(empty.error).not.toBeNull();
    });

    it("cannot insert or delete users", async () => {
      const inserted = await asA.from("users").insert({
        id: randomUUID(),
        email: addr("new"),
        email_normalized: addr("new"),
      });
      expect(inserted.error?.code).toBe("42501");
      const deleted = await asA.from("users").delete().eq("id", a.id);
      expect(deleted.error?.code).toBe("42501");
      expect(await getDb().user.count({ where: { id: a.id } })).toBe(1);
    });

    it("gives nothing to a caller with no user token", async () => {
      const anon = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_PUBLISHABLE_KEY!,
      );
      const { data, error } = await anon.from("users").select("id");
      expect(error !== null || (data ?? []).length === 0).toBe(true);
    });

    it("only honours tokens from our issuer", async () => {
      const good = createUserSupabaseClient(
        await mintWithIssuer(a.id, authConfig.issuer),
      );
      expect((await good.from("users").select("id")).data).toEqual([
        { id: a.id },
      ]);

      const bad = createUserSupabaseClient(
        await mintWithIssuer(a.id, "https://evil.example"),
      );
      const { data, error } = await bad.from("users").select("id");
      expect(error !== null || (data ?? []).length === 0).toBe(true);
    });

    it("keeps the other tables fully locked", async () => {
      for (const table of [
        "auth_sessions",
        "auth_refresh_tokens",
        "user_credentials",
        "user_identities",
        "password_reset_tokens",
      ]) {
        const { data, error } = await asA.from(table).select("*");
        expect(error?.code, table).toBe("42501");
        expect(data).toBeNull();
      }
    });
  },
);
