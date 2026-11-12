import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./origin";

const allowed = "https://leadslookup.example";
const req = (headers: Record<string, string>) =>
  new Request("https://leadslookup.example/api/v1/x", {
    method: "POST",
    headers,
  });

describe("isSameOrigin", () => {
  it("accepts a matching Origin", () => {
    expect(isSameOrigin(req({ origin: allowed }), allowed)).toBe(true);
  });
  it("rejects other origins, ports and schemes", () => {
    expect(isSameOrigin(req({ origin: "https://evil.example" }), allowed)).toBe(
      false,
    );
    expect(
      isSameOrigin(
        req({ origin: "https://leadslookup.example:8443" }),
        allowed,
      ),
    ).toBe(false);
    expect(
      isSameOrigin(req({ origin: "http://leadslookup.example" }), allowed),
    ).toBe(false);
  });
  it("falls back to Referer only when Origin is absent", () => {
    expect(isSameOrigin(req({ referer: `${allowed}/login` }), allowed)).toBe(
      true,
    );
    expect(
      isSameOrigin(req({ referer: "https://evil.example/x" }), allowed),
    ).toBe(false);
    expect(
      isSameOrigin(
        req({ origin: "https://evil.example", referer: `${allowed}/login` }),
        allowed,
      ),
    ).toBe(false);
    expect(isSameOrigin(req({ referer: "not a url" }), allowed)).toBe(false);
  });
  it("rejects requests with neither header", () => {
    expect(isSameOrigin(req({}), allowed)).toBe(false);
  });
});
