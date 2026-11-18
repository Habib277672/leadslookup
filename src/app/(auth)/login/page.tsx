import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/auth-card";
import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your LeadsLookup account.",
};

async function SkipIfSignedIn() {
  if (await getCurrentUser()) redirect("/dashboard");
  return null;
}

export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      description="Use the email and password you registered with."
    >
      <Suspense fallback={null}>
        <SkipIfSignedIn />
      </Suspense>
      <LoginForm />
    </AuthCard>
  );
}
