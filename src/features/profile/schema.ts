import { z } from "zod";

export const themePreferences = ["system", "light", "dark"] as const;

// Strict: unknown keys such as "role" or "status" are rejected, not ignored.
export const profileUpdateSchema = z
  .strictObject({
    displayName: z
      .string()
      .trim()
      .min(2, "Enter your name.")
      .max(80, "Keep your name under 80 characters.")
      .optional(),
    themePreference: z.enum(themePreferences).optional(),
  })
  .refine(
    (v) => v.displayName !== undefined || v.themePreference !== undefined,
    {
      message: "Nothing to update.",
      path: ["displayName"],
    },
  );

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
