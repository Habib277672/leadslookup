import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/auth-card";
import { VerifyEmailForm } from "@/features/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Confirm your email",
  description:
    "Confirm your email address to finish creating your LeadsLookup account.",
  referrer: "no-referrer", // the URL carries a secret token
};

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Confirm your email"
      description="One more step to activate your account."
    >
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </AuthCard>
  );
}
