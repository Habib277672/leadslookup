import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  ContentSection,
  CtaSection,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "Features",
  description:
    "What LeadsLookup is designed to do: category search, country and city filters, business details and a private list of saved leads. Features are in development.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        title="Features"
        description="What LeadsLookup is designed to do. The product is in development: every feature on this page is planned, and none is available yet."
      />
      <ContentSection title="Business discovery">
        <p>
          Search for businesses of a chosen category within an area. The
          categories you can search depend on the place data that has been
          imported and mapped.
        </p>
        <p>
          Search capability and data coverage are different things. A search can
          only return businesses that exist in the data, and coverage varies by
          country and category.
        </p>
      </ContentSection>
      <ContentSection title="Global location filters">
        <p>
          Choose a country, then a region and a city where that country has
          them. Countries are organized differently: some have states or
          provinces, some have counties, some have fewer levels. The filters
          follow the data instead of forcing the same steps everywhere.
        </p>
        <p>
          If a country has no suitable region level in the data, you can go from
          the country straight to a city.
        </p>
      </ContentSection>
      <ContentSection title="Business details">
        <p>
          Each result is planned to show the fields present in its source
          record: name, category, address, coordinates, website and phone.
        </p>
        <p>
          A field that is not in the record is shown as not listed. Not listed
          does not mean a business has no website or phone number. It only means
          the source does not have one.
        </p>
      </ContentSection>
      <ContentSection title="Saved leads">
        <p>
          Save a business to your own list once. Add notes and set an outreach
          status, for example new, contacted, interested or not interested.
        </p>
        <p>Your saved list, notes and statuses are private to your account.</p>
      </ContentSection>
      <ContentSection title="Source and freshness">
        <p>
          Each record is planned to show where it came from and when it was
          imported. Data can be incomplete, duplicated or out of date, so check
          a business yourself before you contact it.
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
        title="See how a search works"
        description="The walkthrough follows one search from category to saved lead."
      >
        <Link
          href="/how-it-works"
          className={buttonVariants({
            size: "lg",
            className: "h-11 px-5 text-base",
          })}
        >
          How it works
        </Link>
        <Link
          href="/register"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "h-11 px-5 text-base",
          })}
        >
          Create an account
        </Link>
      </CtaSection>
    </>
  );
}
