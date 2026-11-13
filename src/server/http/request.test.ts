import { describe, expect, it } from "vitest";
import { getClientIp, readJsonBody } from "./request";

const forwarded = (value: string) => new Headers({ "x-forwarded-for": value });

describe("getClientIp", () => {
  it("ignores the header unless trusted proxy hops are configured", () => {
    expect(getClientIp(forwarded("1.2.3.4"), 0)).toBe("unknown");
    expect(getClientIp(forwarded("1.2.3.4"), Number.NaN)).toBe("unknown");
  });
  it("takes the entry added by our own proxy, not client-controlled ones", () => {
    expect(getClientIp(forwarded("6.6.6.6, 1.2.3.4"), 1)).toBe("1.2.3.4");
    expect(getClientIp(forwarded("6.6.6.6, 5.5.5.5, 1.2.3.4"), 2)).toBe(
      "5.5.5.5",
    );
  });
  it("returns unknown when there are too few entries or no header", () => {
    expect(getClientIp(forwarded("1.2.3.4"), 3)).toBe("unknown");
    expect(getClientIp(new Headers(), 1)).toBe("unknown");
  });
});

describe("readJsonBody", () => {
  const post = (body: string, headers: Record<string, string>) =>
    new Request("http://localhost/x", { method: "POST", body, headers });
  const json = { "content-type": "application/json" };

  it("parses a JSON body", async () => {
    expect(await readJsonBody(post('{"a":1}', json))).toEqual({ a: 1 });
  });
  it("rejects other content types, bad JSON and oversized bodies", async () => {
    expect(
      await readJsonBody(post('{"a":1}', { "content-type": "text/plain" })),
    ).toBeUndefined();
    expect(await readJsonBody(post("{nope", json))).toBeUndefined();
    expect(
      await readJsonBody(
        post(JSON.stringify({ a: "x".repeat(200) }), json),
        100,
      ),
    ).toBeUndefined();
  });
});
