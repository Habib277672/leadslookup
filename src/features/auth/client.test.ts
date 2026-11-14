import { afterEach, describe, expect, it, vi } from "vitest";
import { postJson } from "./client";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(result: Response | Error) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (result instanceof Error) throw result;
      return result;
    }),
  );
}

describe("postJson", () => {
  it("returns the data of a successful response", async () => {
    stubFetch(
      new Response(JSON.stringify({ data: { status: "ok" } }), { status: 200 }),
    );
    expect(await postJson("/x", {})).toEqual({
      ok: true,
      data: { status: "ok" },
    });
  });

  it("returns code, message and field errors from an error response", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          error: {
            code: "invalid_input",
            message: "Check the highlighted fields.",
            fields: { email: "Enter a valid email address." },
          },
        }),
        { status: 400 },
      ),
    );
    expect(await postJson("/x", {})).toMatchObject({
      ok: false,
      code: "invalid_input",
      fields: { email: "Enter a valid email address." },
    });
  });

  it("reads Retry-After on rate limits", async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          error: { code: "rate_limited", message: "Slow down." },
        }),
        {
          status: 429,
          headers: { "Retry-After": "120" },
        },
      ),
    );
    expect(await postJson("/x")).toMatchObject({
      ok: false,
      code: "rate_limited",
      retryAfter: 120,
    });
  });

  it("survives a non-JSON error page and a network failure", async () => {
    stubFetch(new Response("<html>bad gateway</html>", { status: 502 }));
    expect(await postJson("/x")).toMatchObject({ ok: false, code: "internal" });

    stubFetch(new TypeError("fetch failed"));
    expect(await postJson("/x")).toMatchObject({ ok: false, code: "network" });
  });
});
