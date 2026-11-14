import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/auth-card";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your LeadsLookup account.",
  referrer: "no-referrer", // the URL carries a secret token
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      description="You'll be signed out on all devices."
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
