import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  ContentSection,
  PageHeader,
} from "@/components/marketing/page-sections";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Page not found"
          description="This page doesn't exist or has moved."
        />
        <ContentSection title="Where to go next">
          <p className="flex flex-wrap gap-2">
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Home
            </Link>
            <Link
              href="/contact"
              className={buttonVariants({ variant: "outline" })}
            >
              Contact
            </Link>
          </p>
        </ContentSection>
      </main>
      <SiteFooter />
    </>
  );
}
