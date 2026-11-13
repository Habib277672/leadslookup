import { z } from "zod";

/** Policy: trim and lowercase. No provider-specific rules (e.g. Gmail dots). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const email = z
  .string()
  .trim()
  .max(254, "That email address is too long.")
  .pipe(z.email("Enter a valid email address."));

// Passwords are never trimmed or altered.
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use at most 128 characters.");

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Enter your name.")
      .max(80, "Keep your name under 80 characters."),
    email,
    password: passwordSchema,
  })
  .transform((v) => ({ ...v, emailNormalized: normalizeEmail(v.email) }));

// Login does not reveal the password policy.
export const loginSchema = z
  .object({
    email,
    password: z
      .string()
      .min(1, "Enter your password.")
      .max(128, "Enter your password."),
  })
  .transform((v) => ({ ...v, emailNormalized: normalizeEmail(v.email) }));

export const emailOnlySchema = z
  .object({ email })
  .transform((v) => ({ ...v, emailNormalized: normalizeEmail(v.email) }));
