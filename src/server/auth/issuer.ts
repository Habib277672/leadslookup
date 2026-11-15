const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * The `iss` of every token we sign, and the issuer Supabase is told to trust.
 * It must be a stable origin: https in any real deployment, http only for localhost.
 */
export function resolveIssuer(
  authIssuerEnv: string | undefined,
  siteUrl: string,
): string {
  const raw = authIssuerEnv?.trim() || siteUrl;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("AUTH_ISSUER is not a valid URL");
  }
  const isLocal = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
    throw new Error(
      "AUTH_ISSUER must use https (http is allowed only for localhost)",
    );
  }
  if (url.origin !== raw) {
    throw new Error(
      "AUTH_ISSUER must be an origin only: lowercase, no path, no trailing slash",
    );
  }
  return raw;
}
