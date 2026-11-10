import type { Metadata } from "next";
import {
  ContentSection,
  PageHeader,
} from "@/components/marketing/page-sections";
import { ContactForm } from "@/features/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send a question, a data correction request or feedback to the LeadsLookup team.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact"
        description="Questions, data corrections, privacy requests or feedback. Send a message and we'll read it."
      />
      <ContentSection title="Send a message">
        <ContactForm />
      </ContentSection>
      <ContentSection title="Other ways to reach us">
        <p>
          A public support email address has not been set up yet. It will be
          listed here before launch.
        </p>
      </ContentSection>
    </>
  );
}
