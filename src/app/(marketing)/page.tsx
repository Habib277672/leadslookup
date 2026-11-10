import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProductWireframe } from "@/components/marketing/product-wireframe";
import { StickyMobileCta } from "@/components/marketing/sticky-mobile-cta";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
const section = "border-b border-border";
const h2 = "text-2xl font-semibold tracking-tight sm:text-3xl";

const steps = [
  {
    title: "Choose a category",
    body: "Pick the type of business you want to find, such as academies, cafes or clothing shops.",
  },
  {
    title: "Choose a location",
    body: "Select a country, then a region and city where that country has them. Levels differ between countries, so the options follow the data.",
  },
  {
    title: "Review the results",
    body: "See the businesses on record with the details that exist: name, category, address, and website or phone when listed.",
  },
  {
    title: "Save and follow up",
    body: "Save promising businesses to your private list, add notes and track where each one stands.",
  },
];

const capabilities = [
  {
    name: "Category search",
    body: "Find businesses of a chosen type in an area.",
  },
  {
    name: "Location filters",
    body: "Country, then region and city where the country has them.",
  },
  {
    name: "Business details",
    body: "Name, category, address, website and phone, only where listed.",
  },
  {
    name: "Saved leads",
    body: "A private list of businesses you want to follow up.",
  },
  {
    name: "Notes and status",
    body: "Your own notes and an outreach status for each saved business.",
  },
];

const audiences = [
  {
    name: "Web developers",
    body: "Build a shortlist of businesses to review for website work, then check each one yourself.",
  },
  {
    name: "SEO specialists",
    body: "Find local businesses in an area and look at their public web presence.",
  },
  {
    name: "Designers and social media managers",
    body: "Find businesses in a category and area for manual outreach.",
  },
  {
    name: "Other freelancers",
    body: "The same category-and-location search, without a fixed profession.",
  },
];

const faqs = [
  {
    q: "Does LeadsLookup list every business?",
    a: "No. Results come from public datasets, and coverage varies by country and category. A business can be missing, duplicated or out of date.",
  },
  {
    q: "Why might a phone number or website be missing?",
    a: "Public records often lack them. A missing field is shown as not listed. It does not mean the business has no website or phone.",
  },
  {
    q: "Where does the data come from?",
    a: "Locations are designed around GeoNames and businesses around Overture Maps. The Data Sources page explains attribution, freshness and limits.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className={section}>
        <div
          className={`${container} grid gap-10 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:py-24`}
        >
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Find local businesses by category and location.
            </h1>
            <p className="mt-5 max-w-prose text-base text-text-secondary sm:text-lg">
              Choose a business category and a place, review the businesses on
              record, and keep a private list of the ones worth contacting.
            </p>
            <div id="hero-cta" className="mt-8 flex flex-wrap gap-3">
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
                href="/how-it-works"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "h-11 px-5 text-base",
                })}
              >
                See how it works
              </Link>
            </div>
            <p className="mt-4 text-sm text-text-secondary">
              Coverage depends on public datasets and varies by country and
              category.
            </p>
          </div>
          <ProductWireframe />
        </div>
      </section>

      <section className={section}>
        <div
          className={`${container} grid gap-6 py-14 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}
        >
          <h2 className={h2}>Prospect research is scattered</h2>
          <div className="space-y-4 text-text-secondary">
            <p>
              Finding local businesses to contact usually means jumping between
              search engines, maps, directories and spreadsheets. The list you
              end up with is hard to keep tidy.
            </p>
            <p>
              LeadsLookup brings three things into one workflow: searching by
              category and place, seeing the details a business record contains,
              and keeping your own list with notes and a status for each
              prospect.
            </p>
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={`${container} py-14 sm:py-20`}>
          <h2 className={h2}>How it works</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-border pt-4">
                <p className="text-sm font-medium text-text-secondary tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-text-secondary">
            Example search: Academies / Pakistan / Sindh / Sukkur. Results
            depend on the data available for that area.
          </p>
        </div>
      </section>

      <section className={section}>
        <div className={`${container} py-14 sm:py-20`}>
          <h2 className={h2}>What it will do</h2>
          <p className="mt-3 max-w-prose text-text-secondary">
            LeadsLookup is in development. Nothing below is available yet, and
            this list will change as features are released.
          </p>
          <dl className="mt-8 divide-y divide-border border-y border-border">
            {capabilities.map((item) => (
              <div
                key={item.name}
                className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr_auto] sm:items-baseline sm:gap-6"
              >
                <dt className="font-medium">{item.name}</dt>
                <dd className="text-text-secondary">{item.body}</dd>
                <dd>
                  <span className="inline-flex rounded-xs border border-border px-2 py-0.5 text-xs font-medium text-text-secondary">
                    Planned
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={section}>
        <div
          className={`${container} grid gap-6 py-14 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}
        >
          <h2 className={h2}>Honest about the data</h2>
          <div className="space-y-4 text-text-secondary">
            <p>
              LeadsLookup is designed around public datasets: GeoNames for
              locations and Overture Maps for places. Coverage differs by
              country and category, and no dataset is complete.
            </p>
            <p>
              Phone numbers and websites are often missing. A missing field will
              be shown as not listed, never guessed. Each record is meant to
              carry its source and import date, so you can judge how fresh it
              is. Check a business yourself before you contact it.
            </p>
            <p>
              <Link
                href="/data-sources"
                className="font-medium text-text-primary underline underline-offset-4"
              >
                Read about data sources
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={`${container} py-14 sm:py-20`}>
          <h2 className={h2}>Who it helps</h2>
          <dl className="mt-8 grid gap-x-16 gap-y-6 sm:grid-cols-2">
            {audiences.map((item) => (
              <div key={item.name} className="border-t border-border pt-4">
                <dt className="font-medium">{item.name}</dt>
                <dd className="mt-1 text-text-secondary">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={section}>
        <div
          className={`${container} grid gap-6 py-14 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}
        >
          <h2 className={h2}>Common questions</h2>
          <div>
            {faqs.map((item) => (
              <details
                key={item.q}
                className="border-b border-border py-4 first:pt-0"
              >
                <summary className="cursor-pointer rounded-md font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  {item.q}
                </summary>
                <p className="mt-2 text-text-secondary">{item.a}</p>
              </details>
            ))}
            <p className="mt-6">
              <Link
                href="/faq"
                className="font-medium text-text-primary underline underline-offset-4"
              >
                See all questions
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className={`${container} py-14 sm:py-20`}>
          <h2 className={h2}>Start your prospect list</h2>
          <p className="mt-3 max-w-prose text-text-secondary">
            Create an account to search, save and organize the businesses you
            want to follow up.
          </p>
          <div id="closing-cta" className="mt-6">
            <Link
              href="/register"
              className={buttonVariants({
                size: "lg",
                className: "h-11 px-5 text-base",
              })}
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <StickyMobileCta />
    </>
  );
}
