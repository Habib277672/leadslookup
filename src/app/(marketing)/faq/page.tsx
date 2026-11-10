import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about LeadsLookup's data sources, coverage and accuracy, search, accounts and pricing.",
};

const groups = [
  {
    title: "Data sources",
    items: [
      {
        q: "Where do business records come from?",
        a: "From public datasets. LeadsLookup is designed around Overture Maps for places and GeoNames for locations.",
      },
      {
        q: "What is GeoNames used for?",
        a: "For the countries, regions and cities in the location filters.",
      },
      {
        q: "What is Overture Maps used for?",
        a: "For business and place records: names, categories, addresses, and website or phone where the record has them.",
      },
      {
        q: "How is attribution handled?",
        a: "Required credits appear on the Data sources page and will appear wherever records are shown.",
      },
    ],
  },
  {
    title: "Coverage and accuracy",
    items: [
      {
        q: "Are all businesses listed?",
        a: "No. Coverage varies by country and category, and some businesses will be missing, duplicated or out of date.",
      },
      {
        q: "Why might a phone number or website be missing?",
        a: "Public records often do not have them. A missing field is shown as not listed. It does not mean the business has no website or phone.",
      },
      {
        q: "How recent is a record?",
        a: "Each record is meant to show when it was imported. Overture publishes releases roughly monthly and LeadsLookup imports selected areas, so a record can be older than the latest release.",
      },
      {
        q: "How can I report a missing or incorrect record?",
        a: "Use the contact page. A dedicated reporting flow has not been built yet.",
      },
    ],
  },
  {
    title: "Search",
    items: [
      {
        q: "Which categories and countries are available?",
        a: "That depends on imported data, and imports have not started. The list will be published as areas are added.",
      },
      {
        q: "Why might a location level be unavailable?",
        a: "Countries are organized differently, and the dataset may not have every level for every country. When a level is missing you can go straight from country to city.",
      },
    ],
  },
  {
    title: "Account and privacy",
    items: [
      {
        q: "How does Google sign-in work?",
        a: "You will be able to continue with Google. Google confirms who you are, and LeadsLookup then starts its own session. Only your basic profile and email are requested.",
      },
      {
        q: "How are saved leads protected?",
        a: "Saved leads, notes and statuses are designed to be tied to your account and checked on the server and in the database, so other users cannot read or change them.",
      },
      {
        q: "How can I change or delete my account data?",
        a: "Accounts are not available yet. The privacy policy will explain how to request changes or deletion.",
      },
    ],
  },
  {
    title: "Pricing",
    items: [
      {
        q: "How much does LeadsLookup cost?",
        a: "No price has been set. LeadsLookup is in development and nothing is for sale yet.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        description="Answers about data, coverage, search, accounts and pricing. Features described as planned are not available yet."
      />
      {groups.map((group) => (
        <ContentSection key={group.title} title={group.title}>
          <div className="-mt-4">
            {group.items.map((item) => (
              <details key={item.q} className="border-b border-border py-4">
                <summary className="cursor-pointer rounded-md font-medium text-text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  {item.q}
                </summary>
                <p className="mt-2">{item.a}</p>
              </details>
            ))}
          </div>
        </ContentSection>
      ))}
      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-text-secondary">
            Something not answered here?{" "}
            <Link
              href="/contact"
              className="font-medium text-text-primary underline underline-offset-4"
            >
              Get in touch
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
