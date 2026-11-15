import "server-only";
import { siteConfig } from "@/config/site";
import { resolveIssuer } from "./issuer";

let issuer: string | undefined;

export const authConfig = {
  get issuer(): string {
    return (issuer ??= resolveIssuer(process.env.AUTH_ISSUER, siteConfig.url));
  },
  accessAudience: "authenticated",
  refreshAudience: "leadslookup:refresh",
  accessTtlSeconds: 15 * 60,
  refreshTtlSeconds: 30 * 24 * 60 * 60,
  emailVerificationTtlSeconds: 24 * 60 * 60,
  passwordResetTtlSeconds: 30 * 60,
} as const;
