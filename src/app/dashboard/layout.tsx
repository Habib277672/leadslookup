import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/features/dashboard/dashboard-shell";
import { ShellSkeleton } from "@/features/dashboard/shell-skeleton";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

async function Authenticated({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  // ?_r=1 stops the proxy from bouncing a revoked session back here.
  if (!user) redirect("/login?_r=1");
  return (
    <DashboardShell
      user={{
        displayName: user.displayName,
        email: user.email,
        themePreference: user.themePreference,
      }}
    >
      {" "}
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Authenticated>{children}</Authenticated>
    </Suspense>
  );
}
