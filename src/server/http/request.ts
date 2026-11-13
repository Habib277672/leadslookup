/** Parsed JSON body, or undefined if missing, oversized, not JSON, or the wrong content type. */
export async function readJsonBody(
  request: Request,
  maxBytes = 16_384,
): Promise<unknown> {
  const type = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!type.startsWith("application/json")) return undefined;
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes)
    return undefined;

  const text = await request.text();
  if (Buffer.byteLength(text) > maxBytes) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * X-Forwarded-For can be forged by the client, but proxies we control append
 * to it. With N trusted proxies, the client IP is the Nth entry from the right.
 * With none configured we cannot know the IP, so we return "unknown".
 */
export function getClientIp(
  headers: Headers,
  hops: number = Number(process.env.TRUSTED_PROXY_HOPS ?? 0),
): string {
  if (!Number.isInteger(hops) || hops < 1) return "unknown";
  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return entries[entries.length - hops] ?? "unknown";
}
