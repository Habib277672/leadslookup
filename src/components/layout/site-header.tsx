import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
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
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Log in
            </Link>
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Get started
            </Link>
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
