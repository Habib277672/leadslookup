import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  ContentSection,
  CtaSection,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How a LeadsLookup search works: choose a category, choose a location, review the results, then save and organize the businesses you want to contact.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How it works"
        description="Four steps from a category and a place to a private list of prospects. The product is in development, so this describes the planned workflow."
      />
      <ContentSection title="1. Choose a category">
        <p>
          Select the type of business you want to find, for example academies,
          cafes, clothing shops or mobile shops.
        </p>
        <p>
          Which categories are available depends on the place data that has been
          imported and how its categories are mapped.
        </p>
      </ContentSection>
      <ContentSection title="2. Choose a location">
        <p>
          Pick a country, then a region and a city. Region is optional, and the
          label adapts to the country (state, province, region and so on).
        </p>
        <p>
          If a country has no suitable region level in the data, you go from the
          country straight to a city.
        </p>
        <p className="rounded-md border border-dashed border-border p-4 text-sm">
          <span className="font-medium text-text-primary">Example search:</span>{" "}
          Academies / Pakistan / Sindh / Sukkur. This is an example of the flow.
          It is not a promise that records exist for that area.
        </p>
      </ContentSection>
      <ContentSection title="3. Review the results">
        <p>
          You see the businesses on record that match, with the details their
          source records contain. Missing details are shown as not listed.
        </p>
        <p>
          You may also see partial records or no results at all. That reflects
          what the data holds for the area, not whether such businesses exist.
        </p>
      </ContentSection>
      <ContentSection title="4. Save and organize">
        <p>
          Save promising businesses to your private list, add notes, and set an
          outreach status as you follow up. Saving the same business twice is
          not possible.
        </p>
      </ContentSection>
      <CtaSection
        title="Ready to try it?"
        description="Create an account to be ready when search opens, or read about the data behind it first."
      >
        <Link
          href="/register"
          className={buttonVariants({
            size: "lg",
            className: "h-11 px-5 text-base",
          })}
        >
          Create an account
        </Link>
        <Link
          href="/data-sources"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "h-11 px-5 text-base",
          })}
        >
          Data sources
        </Link>
      </CtaSection>
    </>
  );
}
