import { describe, expect, it } from "vitest";
import { profileUpdateSchema } from "./schema";

describe("profileUpdateSchema", () => {
  it("accepts a name, a theme or both, and trims the name", () => {
    expect(
      profileUpdateSchema.parse({ displayName: "  Ayesha Khan " }),
    ).toEqual({ displayName: "Ayesha Khan" });
    expect(profileUpdateSchema.parse({ themePreference: "dark" })).toEqual({
      themePreference: "dark",
    });
    expect(
      profileUpdateSchema.safeParse({
        displayName: "Al",
        themePreference: "light",
      }).success,
    ).toBe(true);
  });

  it("rejects bad names and unknown themes", () => {
    expect(profileUpdateSchema.safeParse({ displayName: "A" }).success).toBe(
      false,
    );
    expect(
      profileUpdateSchema.safeParse({ displayName: "x".repeat(81) }).success,
    ).toBe(false);
    expect(
      profileUpdateSchema.safeParse({ themePreference: "neon" }).success,
    ).toBe(false);
  });

  it("rejects an empty update and any field that is not editable", () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(false);
    expect(
      profileUpdateSchema.safeParse({
        displayName: "Valid Name",
        role: "admin",
      }).success,
    ).toBe(false);
    expect(profileUpdateSchema.safeParse({ status: "active" }).success).toBe(
      false,
    );
    expect(profileUpdateSchema.safeParse({ email: "a@b.test" }).success).toBe(
      false,
    );
  });
});
