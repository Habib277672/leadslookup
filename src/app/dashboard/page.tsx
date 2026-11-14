import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogoutButtons } from "@/features/auth/logout-button";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

async function Content() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Signed in</h1>
      <p className="text-sm text-muted-foreground">
        {user.displayName ?? "Your account"} ({user.email}), role: {user.role}.
        This page is a temporary placeholder until the dashboard is built.
      </p>
      <LogoutButtons />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-xl flex-1 px-4 py-16 sm:px-6"
    >
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <Content />
      </Suspense>
    </main>
  );
}
