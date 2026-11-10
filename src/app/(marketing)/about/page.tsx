import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  ContentSection,
  CtaSection,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why LeadsLookup exists, who it is for, and the limits of the data behind it.",
};

const principles = [
  {
    name: "Free, open data first",
    body: "It is built on public datasets, so a commercial data subscription is not the starting point.",
  },
  {
    name: "Source transparency",
    body: "Records are meant to show where they come from and when they were imported.",
  },
  {
    name: "Your list stays yours",
    body: "Saved leads, notes and statuses are private to your account.",
  },
  {
    name: "Honest data quality",
    body: "Missing information is shown as missing. Nothing is guessed or filled in.",
  },
  {
    name: "Incremental delivery",
    body: "Features are released when they work, and planned features are labeled as planned.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About LeadsLookup"
        description="A tool for freelancers who want to find businesses worth contacting and keep track of them in one place."
      />
      <ContentSection title="Why it exists">
        <p>
          Freelancers often look for clients one business at a time: a search
          here, a map there, a directory, a spreadsheet. LeadsLookup is meant to
          bring that into one workflow, built on public data rather than paid
          lead databases.
        </p>
        <p>
          It serves web developers, SEO specialists, designers, social media
          managers and other freelancers. It does not assume any one profession.
        </p>
      </ContentSection>
      <ContentSection title="Principles">
        <dl className="space-y-4">
          {principles.map((item) => (
            <div key={item.name} className="border-t border-border pt-4">
              <dt className="font-medium text-text-primary">{item.name}</dt>
              <dd className="mt-1">{item.body}</dd>
            </div>
          ))}
        </dl>
      </ContentSection>
      <ContentSection title="Scope and limits">
        <p>
          Worldwide coverage is the goal, built up step by step. It is not a
          claim that every business in every country is listed. Records can be
          incomplete, duplicated or out of date, and results are potential
          prospects to verify, not guaranteed leads.
        </p>
        <p>
          <Link
            href="/data-sources"
            className="font-medium text-text-primary underline underline-offset-4"
          >
            Read about data sources
          </Link>
        </p>
      </ContentSection>
      <CtaSection
        title="Questions or feedback?"
        description="The contact page explains how to reach us."
      >
        <Link
          href="/contact"
          className={buttonVariants({
            size: "lg",
            className: "h-11 px-5 text-base",
          })}
        >
          Contact
        </Link>
      </CtaSection>
    </>
  );
}
