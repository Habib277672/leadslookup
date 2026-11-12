import "server-only";
import { siteConfig } from "@/config/site";
import { fail } from "@/server/http/responses";

/** Origin/Referer check for cookie-authenticated, state-changing requests. */
export function isSameOrigin(
  request: Request,
  allowedOrigin: string = new URL(siteConfig.url).origin,
): boolean {
  const origin = request.headers.get("origin");
  if (origin) return origin === allowedOrigin;

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === allowedOrigin;
    } catch {
      return false;
    }
  }
  return false; // browsers send Origin on POST; no header means not a normal browser request
}

export function rejectCrossOrigin(request: Request): Response | null {
  return isSameOrigin(request)
    ? null
    : fail("forbidden", "Cross-origin request rejected.", 403);
}
