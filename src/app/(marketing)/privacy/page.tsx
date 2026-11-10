import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  DraftNotice,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How LeadsLookup is designed to handle account details, saved leads, cookies, analytics and security data.",
};

const list = "list-disc space-y-1 pl-5";
const link = "font-medium text-text-primary underline underline-offset-4";

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy policy"
        description="How LeadsLookup is designed to handle personal information. Last updated 10 November 2026."
      />
      <DraftNotice>
        This policy describes planned processing for a product that is still in
        development. It has not had legal review. Before launch it will be
        checked against the live product, and the operator details and retention
        periods will be added.
      </DraftNotice>
      <ContentSection title="Who is responsible">
        <p>
          The operator&apos;s name, address and contact details will be added
          before launch. Until then, use the{" "}
          <Link href="/contact" className={link}>
            contact page
          </Link>
          .
        </p>
      </ContentSection>
      <ContentSection title="Information we plan to process">
        <ul className={list}>
          <li>
            Account details: your email address, a display name, and for email
            accounts a password hash. The password itself is never stored.
          </li>
          <li>
            Google sign-in: if you continue with Google, your Google account
            identifier, email address and name as Google provides them. Only
            basic profile and email are requested.
          </li>
          <li>
            Your leads: the businesses you save, the notes you write and the
            outreach status you set.
          </li>
          <li>Preferences: your theme choice (Light, Dark or System).</li>
          <li>
            Security and session data: session records, IP address and browser
            details, used to protect accounts and limit abuse.
          </li>
          <li>Contact messages: whatever you send through the contact form.</li>
          <li>
            Search activity: your searches are processed to return results and
            to limit abuse.
          </li>
        </ul>
      </ContentSection>
      <ContentSection title="How we use it">
        <p>
          To provide the service, keep accounts secure, answer your messages and
          prevent abuse. Optional analytics would be used to understand how the
          site is used, and only with your consent.
        </p>
      </ContentSection>
      <ContentSection title="Cookies and similar storage">
        <p>
          The{" "}
          <Link href="/cookies" className={link}>
            cookie policy
          </Link>{" "}
          lists what is stored in your browser and why.
        </p>
      </ContentSection>
      <ContentSection title="Analytics">
        <p>
          No analytics are in use, and no provider has been chosen. If analytics
          are added, they will load only after you opt in. Passwords, tokens,
          email addresses, message contents and personal notes will never be
          sent to them.
        </p>
      </ContentSection>
      <ContentSection title="Who processes data for us">
        <p>
          The service is planned to rely on a hosting provider, a hosted
          PostgreSQL database provider (currently planned: Supabase), an email
          delivery provider (not chosen yet), and Google for sign-in if you use
          it. The final list will be named here before launch.
        </p>
      </ContentSection>
      <ContentSection title="Business records">
        <p>
          Business records come from public datasets and describe businesses.
          Some may include names, addresses or contact details that relate to
          individuals, such as sole traders. LeadsLookup is not the original
          source of those records. If a record is wrong or should not appear,
          tell us through the contact page.
        </p>
      </ContentSection>
      <ContentSection title="Retention">
        <p>To be confirmed before launch.</p>
      </ContentSection>
      <ContentSection title="Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct,
          delete or object to the use of your personal information. The final
          list will reflect the laws that apply to the places we operate in. To
          make a request, use the contact page.
        </p>
      </ContentSection>
      <ContentSection title="Security">
        <p>
          The service is designed so that passwords are stored only as strong
          hashes, sign-in cookies are not readable by page scripts, and saved
          leads are visible only to the account that owns them. No system is
          perfectly secure, and we will describe how to report a security
          problem before launch.
        </p>
      </ContentSection>
      <ContentSection title="Changes">
        <p>Material changes will be shown on this page with a new date.</p>
      </ContentSection>
    </>
  );
}
