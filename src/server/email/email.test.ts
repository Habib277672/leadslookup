import nodemailer from "nodemailer";
import { describe, expect, it } from "vitest";
import { createSmtpEmailService } from "./email-service";
import { buildVerificationUrl, verificationEmail } from "./templates";

describe("verification email", () => {
  it("links to the configured site URL with an encoded token", () => {
    const url = buildVerificationUrl("a+b/c=");
    expect(url).toMatch(/^https?:\/\/[^/]+\/verify-email\?token=a%2Bb%2Fc%3D$/);
  });

  it("escapes the display name in HTML and keeps one link", () => {
    const mail = verificationEmail({
      to: "a@example.test",
      displayName: `<script>alert("x")</script>`,
      token: "tok",
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.text.match(/verify-email\?token=/g)).toHaveLength(1);
    expect(mail.subject).toBe("Confirm your email for LeadsLookup");
  });
});

describe("SMTP email service", () => {
  it("sends through a transport and returns the message id", async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const service = createSmtpEmailService(
      transport,
      "LeadsLookup <no-reply@example.test>",
    );
    const result = await service.send({
      to: "a@example.test",
      subject: "Hello",
      text: "Hello",
      html: "<p>Hello</p>",
    });
    expect(result.id).toBeTruthy();
  });
});
