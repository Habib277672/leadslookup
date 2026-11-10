import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  DraftNotice,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description:
    "The terms for using LeadsLookup: acceptable use, account responsibilities, data source licenses and limits on accuracy.",
};

const list = "list-disc space-y-1 pl-5";
const link = "font-medium text-text-primary underline underline-offset-4";

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms and conditions"
        description="The terms for using LeadsLookup. Last updated 10 November 2026."
      />
      <DraftNotice>
        These terms are a draft for a product that is still in development. They
        have not had legal review. Before launch they will be checked against
        the live product and completed with the operator details, governing law
        and any pricing terms.
      </DraftNotice>
      <ContentSection title="Using LeadsLookup">
        <p>
          LeadsLookup helps you find businesses and organize prospects. You may
          use it for lawful purposes and in line with these terms.
        </p>
      </ContentSection>
      <ContentSection title="Your account">
        <p>
          You are responsible for the accuracy of your account details, for
          keeping your sign-in secure, and for activity on your account. Tell us
          if you think your account has been used without permission.
        </p>
      </ContentSection>
      <ContentSection title="Acceptable use">
        <p>You must not:</p>
        <ul className={list}>
          <li>
            use automated tools to bulk-copy results or put excessive load on
            the service;
          </li>
          <li>bypass limits, access controls or other protections;</li>
          <li>attempt to access another user&apos;s data;</li>
          <li>
            use results to send unlawful, deceptive or unsolicited bulk
            messages.
          </li>
        </ul>
      </ContentSection>
      <ContentSection title="Data sources and attribution">
        <p>
          Location and business data comes from third-party public datasets,
          each with its own license and attribution requirements. You must
          respect those terms when you use the data. See{" "}
          <Link href="/data-sources" className={link}>
            data sources
          </Link>
          .
        </p>
      </ContentSection>
      <ContentSection title="Accuracy and availability">
        <p>
          Results are potential prospects, not guaranteed leads. Records can be
          incomplete, duplicated or out of date, and contact details may be
          missing or wrong. The service is provided as is, without a promise
          that it will always be available or error-free.
        </p>
      </ContentSection>
      <ContentSection title="Your outreach">
        <p>
          You are responsible for checking a business&apos;s details before you
          contact it, and for following the laws that apply to your outreach,
          including rules on marketing messages and privacy.
        </p>
      </ContentSection>
      <ContentSection title="Suspension and termination">
        <p>
          We may suspend or close an account that breaks these terms or puts the
          service or other users at risk. You can stop using LeadsLookup at any
          time.
        </p>
      </ContentSection>
      <ContentSection title="Governing law">
        <p>To be confirmed before launch.</p>
      </ContentSection>
      <ContentSection title="Changes and contact">
        <p>
          We may update these terms, and material changes will be shown on this
          page with a new date. Questions can go through the{" "}
          <Link href="/contact" className={link}>
            contact page
          </Link>
          .
        </p>
      </ContentSection>
    </>
  );
}
