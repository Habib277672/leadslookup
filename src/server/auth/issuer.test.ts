import { describe, expect, it } from "vitest";
import { resolveIssuer } from "./issuer";

const SITE = "http://localhost:3000";

describe("resolveIssuer", () => {
  it("falls back to the site URL when AUTH_ISSUER is empty", () => {
    expect(resolveIssuer(undefined, SITE)).toBe(SITE);
    expect(resolveIssuer("   ", SITE)).toBe(SITE);
  });

  it("uses AUTH_ISSUER over the site URL and ignores surrounding whitespace", () => {
    expect(
      resolveIssuer(
        " https://leadslookup.vercel.app ",
        "https://other.example",
      ),
    ).toBe("https://leadslookup.vercel.app");
  });

  it("accepts http only for localhost", () => {
    expect(resolveIssuer("http://127.0.0.1:3000", SITE)).toBe(
      "http://127.0.0.1:3000",
    );
    expect(() => resolveIssuer("http://leadslookup.vercel.app", SITE)).toThrow(
      /https/,
    );
    expect(() => resolveIssuer(undefined, "http://example.com")).toThrow(
      /https/,
    );
  });

  it("rejects anything that is not exactly an origin", () => {
    expect(() =>
      resolveIssuer("https://leadslookup.vercel.app/", SITE),
    ).toThrow(/origin/);
    expect(() =>
      resolveIssuer("https://leadslookup.vercel.app/auth", SITE),
    ).toThrow(/origin/);
    expect(() => resolveIssuer("https://LeadsLookup.vercel.app", SITE)).toThrow(
      /origin/,
    );
    expect(() =>
      resolveIssuer("https://leadslookup.vercel.app?x=1", SITE),
    ).toThrow(/origin/);
  });

  it("rejects garbage and non-web schemes", () => {
    expect(() => resolveIssuer("not a url", SITE)).toThrow(/valid URL/);
    expect(() => resolveIssuer("ftp://leadslookup.vercel.app", SITE)).toThrow(
      /https/,
    );
  });
});
