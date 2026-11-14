import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/auth-card";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your LeadsLookup account.",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      description="Use the email and password you registered with."
    >
      <LoginForm />
    </AuthCard>
  );
}
