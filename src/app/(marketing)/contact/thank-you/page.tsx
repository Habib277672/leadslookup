import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  ContentSection,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "Message sent",
  description: "Your message to LeadsLookup has been sent.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      <PageHeader
        title="Message sent"
        description="Thanks for getting in touch."
      />
      <ContentSection title="What happens next">
        <p>
          We read every message. If it needs a reply, we&apos;ll answer at the
          email address you gave.
        </p>
        <p>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to home
          </Link>
        </p>
      </ContentSection>
    </>
  );
}
