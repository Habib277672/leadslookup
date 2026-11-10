import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(100, "Keep your name under 100 characters."),
  email: z
    .string()
    .trim()
    .max(254, "That email address is too long.")
    .pipe(z.email("Enter a valid email address.")),
  subject: z
    .string()
    .trim()
    .min(3, "Enter a subject.")
    .max(150, "Keep the subject under 150 characters."),
  message: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters.")
    .max(5000, "Keep your message under 5,000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactField = keyof ContactInput;

export type ContactState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
  values?: Record<ContactField, string>;
};
