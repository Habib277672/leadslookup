import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface EmailService {
  send(message: EmailMessage): Promise<{ id: string }>;
}

export function createSmtpEmailService(
  transport: Transporter,
  from: string,
): EmailService {
  return {
    async send(message) {
      const info = await transport.sendMail({ from, ...message });
      return { id: info.messageId };
    },
  };
}

let service: EmailService | undefined;

/** Dev defaults to Mailpit (127.0.0.1:1025). Production must configure SMTP explicitly. */
export function getEmailService(): EmailService {
  if (service) return service;

  const production = process.env.NODE_ENV === "production";
  const host = process.env.SMTP_HOST;
  const from = process.env.EMAIL_FROM;
  if (production && (!host || !from)) {
    throw new Error("SMTP_HOST and EMAIL_FROM must be set in production");
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const transport = nodemailer.createTransport({
    host: host ?? "127.0.0.1",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
    auth: user && pass ? { user, pass } : undefined,
  });

  service = createSmtpEmailService(
    transport,
    from ?? "LeadsLookup <no-reply@leadslookup.local>",
  );
  return service;
}
