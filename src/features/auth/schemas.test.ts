import { describe, expect, it } from "vitest";
import { loginSchema, normalizeEmail, registerSchema } from "./schemas";

const valid = {
  displayName: "Habib Ur Rehman",
  email: "  Habib@Example.COM ",
  password: "a long enough pass",
};

describe("registerSchema", () => {
  it("normalizes the email and keeps the display email trimmed", () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe("Habib@Example.COM");
    expect(parsed.emailNormalized).toBe("habib@example.com");
  });

  it("never trims the password", () => {
    const password = "  spaces around  ";
    expect(registerSchema.parse({ ...valid, password }).password).toBe(
      password,
    );
  });

  it("rejects bad input", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, password: "x".repeat(129) }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, displayName: " " }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("does not apply the registration password policy", () => {
    expect(
      loginSchema.safeParse({ email: "a@example.com", password: "x" }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: "a@example.com", password: "" }).success,
    ).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases only", () => {
    expect(normalizeEmail("  A.B+tag@Example.com ")).toBe(
      "a.b+tag@example.com",
    );
  });
});
