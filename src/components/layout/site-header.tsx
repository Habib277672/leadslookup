import Link from "next/link";
import { Suspense } from "react";
import { HeaderAuth } from "@/components/layout/header-auth";
import { HeaderAuthLoader } from "@/components/layout/header-auth-loader";
import { MainNav } from "@/components/layout/main-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-md text-base font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {siteConfig.name}
        </Link>
        <MainNav />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Suspense fallback={<HeaderAuth signedIn={false} />}>
            <HeaderAuthLoader />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
