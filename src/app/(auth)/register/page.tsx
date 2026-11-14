import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/auth-card";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a LeadsLookup account to find and organize business leads.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="You'll confirm your email address before you can log in."
    >
      <RegisterForm />
    </AuthCard>
  );
}
