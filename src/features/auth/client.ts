export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
  retryAfter?: number;
};
export type ApiResult<T> = { ok: true; data: T } | ({ ok: false } & ApiError);

type ErrorBody = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

/** POSTs JSON to our own API. The browser adds the Origin header and sends cookies. */
/** Sends JSON to our own API. The browser adds the Origin header and sends cookies. */
export async function sendJson<T = unknown>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json: unknown = await response.json().catch(() => null);

    if (response.ok) {
      return { ok: true, data: (json as { data: T } | null)?.data as T };
    }
    const error = (json as ErrorBody | null)?.error;
    const retry = Number(response.headers.get("Retry-After"));
    return {
      ok: false,
      code: error?.code ?? "internal",
      message: error?.message ?? "Something went wrong. Please try again.",
      fields: error?.fields,
      retryAfter: Number.isFinite(retry) && retry > 0 ? retry : undefined,
    };
  } catch {
    return {
      ok: false,
      code: "network",
      message: "Can't reach the server. Check your connection and try again.",
    };
  }
}

export const postJson = <T = unknown>(path: string, body?: unknown) =>
  sendJson<T>("POST", path, body);

export const patchJson = <T = unknown>(path: string, body?: unknown) =>
  sendJson<T>("PATCH", path, body);

export const deleteJson = <T = unknown>(path: string) =>
  sendJson<T>("DELETE", path);
