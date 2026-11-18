import Link from "next/link";
import type { ReactNode } from "react";
// import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DashboardThemeToggle } from "@/features/profile/dashboard-theme-toggle";
import { ThemeSync } from "@/features/profile/theme-sync";
import { siteConfig } from "@/config/site";
import { MobileSidebar } from "./mobile-sidebar";
import { NavList } from "./nav-list";
import { UserMenu, type ShellUser } from "./user-menu";

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      <ThemeSync serverPreference={user.themePreference} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-3 focus:ring-ring/50"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link
            href="/dashboard"
            className="rounded-md text-base font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {siteConfig.name}
          </Link>
        </div>
        <nav aria-label="Dashboard" className="flex-1 overflow-y-auto p-2">
          <NavList />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background px-4 sm:px-6">
          <MobileSidebar />
          <div className="ml-auto flex items-center gap-1">
            <DashboardThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none sm:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
