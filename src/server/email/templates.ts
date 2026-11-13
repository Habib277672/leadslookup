import "server-only";
import { siteConfig } from "@/config/site";
import type { EmailMessage } from "./email-service";

const entities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => entities[c] ?? c);

/** Always built from the configured site URL, never from request headers. */
export function buildVerificationUrl(token: string): string {
  return `${siteConfig.url}/verify-email?token=${encodeURIComponent(token)}`;
}

export function verificationEmail(args: {
  to: string;
  displayName: string;
  token: string;
}): EmailMessage {
  const url = buildVerificationUrl(args.token);
  const text = [
    `Hi ${args.displayName},`,
    "",
    "Confirm your email address to finish creating your LeadsLookup account:",
    "",
    url,
    "",
    "This link works once and expires in 24 hours. If you didn't create an account, you can ignore this email.",
  ].join("\n");

  const html = `<p>Hi ${escapeHtml(args.displayName)},</p>
<p>Confirm your email address to finish creating your LeadsLookup account:</p>
<p><a href="${escapeHtml(url)}">Confirm email address</a></p>
<p>This link works once and expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`;

  return {
    to: args.to,
    subject: "Confirm your email for LeadsLookup",
    text,
    html,
  };
}

export function accountExistsEmail(args: { to: string }): EmailMessage {
  const loginUrl = `${siteConfig.url}/login`;
  const resetUrl = `${siteConfig.url}/forgot-password`;
  const text = [
    "Someone tried to create a LeadsLookup account with this email address, but you already have one.",
    "",
    `Log in: ${loginUrl}`,
    `Forgot your password? ${resetUrl}`,
    "",
    "If this wasn't you, you can ignore this email. Your account has not been changed.",
  ].join("\n");
  const html = `<p>Someone tried to create a LeadsLookup account with this email address, but you already have one.</p>
<p><a href="${escapeHtml(loginUrl)}">Log in</a> or <a href="${escapeHtml(resetUrl)}">reset your password</a>.</p>
<p>If this wasn't you, you can ignore this email. Your account has not been changed.</p>`;
  return {
    to: args.to,
    subject: "You already have a LeadsLookup account",
    text,
    html,
  };
}
