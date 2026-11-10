import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "Data sources",
  description:
    "Where LeadsLookup's location and business data comes from, how attribution works, and the limits of coverage and freshness.",
};

export default function DataSourcesPage() {
  return (
    <>
      <PageHeader
        title="Data sources and coverage"
        description="LeadsLookup is designed around public datasets. This page explains what they are, what they can and cannot tell you, and how to read the results."
      />
      <ContentSection title="Where the data comes from">
        <p>
          Locations come from GeoNames. Businesses and other places come from
          Overture Maps. LeadsLookup is in development and has not imported
          either dataset yet. This page will be updated as imports start.
        </p>
      </ContentSection>
      <ContentSection title="GeoNames">
        <p>
          GeoNames provides the countries, regions and cities used in the
          location filters. Its data is licensed under Creative Commons
          Attribution 4.0 and is supplied without a warranty of accuracy or
          completeness. The required credit is: location data from GeoNames
          (geonames.org), licensed under CC BY 4.0.
        </p>
      </ContentSection>
      <ContentSection title="Overture Maps">
        <p>
          Overture Maps publishes downloadable place data that includes
          businesses, schools and other places. Its places data is distributed
          under source-dependent licenses, and releases are published roughly
          monthly. LeadsLookup plans to import selected areas, not the whole
          world.
        </p>
        <p>
          Overture documents known issues, including duplicate records, junk
          records and low completeness of properties. Its confidence score
          describes whether a place exists. It is not a calibrated probability.
        </p>
      </ContentSection>
      <ContentSection title="Coverage and freshness">
        <p>
          Global datasets do not mean complete coverage. Some cities and
          categories will return few results, and phone numbers, websites and
          emails are not guaranteed to be present.
        </p>
        <p>
          A field that is missing from a record is shown as not listed. It is
          never guessed. Each record is meant to show its source and the date it
          was imported, so you can judge how fresh it is. Businesses close, move
          and change details, so check a business yourself before you contact
          it.
        </p>
      </ContentSection>
      <ContentSection title="Report a problem">
        <p>
          If you find a missing or incorrect record, tell us on the{" "}
          <Link
            href="/contact"
            className="font-medium text-text-primary underline underline-offset-4"
          >
            contact page
          </Link>
          . A dedicated reporting flow has not been built yet.
        </p>
      </ContentSection>
    </>
  );
}
