import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  DraftNotice,
  PageHeader,
} from "@/components/marketing/page-sections";

export const metadata: Metadata = {
  title: "Cookie policy",
  description:
    "What LeadsLookup stores in your browser, why, and how optional analytics and consent choices work.",
};

const items = [
  {
    name: "Theme preference",
    status: "In use",
    body: "Remembers whether you chose Light, Dark or System. Stored in your browser's local storage under the key theme, until you clear it.",
  },
  {
    name: "Sign-in cookies",
    status: "Planned",
    body: "Keep you signed in once accounts exist. Essential, and not readable by page scripts. Lifetimes will be listed before launch.",
  },
  {
    name: "Form protection",
    status: "Planned",
    body: "Protects forms that change your data from being submitted by other sites. Essential.",
  },
  {
    name: "Google sign-in step",
    status: "Planned",
    body: "A short-lived cookie used only while you sign in with Google. Essential.",
  },
  {
    name: "Cookie choice",
    status: "Planned",
    body: "Remembers your consent choice, the categories, the date and the policy version.",
  },
  {
    name: "Analytics",
    status: "Not in use",
    body: "No analytics are active and no provider has been chosen. If added, they will load only after you opt in.",
  },
];

const link = "font-medium text-text-primary underline underline-offset-4";

export default function CookiesPage() {
  return (
    <>
      <PageHeader
        title="Cookie policy"
        description="What LeadsLookup stores in your browser and why. Last updated 10 November 2026."
      />
      <DraftNotice>
        This policy is a draft. Only the theme preference is in use today. The
        other items describe planned behavior and will be checked against the
        live product, and legally reviewed, before launch.
      </DraftNotice>
      <ContentSection title="What is stored">
        <dl className="space-y-4">
          {items.map((item) => (
            <div key={item.name} className="border-t border-border pt-4">
              <dt className="flex flex-wrap items-center gap-2 font-medium text-text-primary">
                {item.name}
                <span className="inline-flex rounded-xs border border-border px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {item.status}
                </span>
              </dt>
              <dd className="mt-1">{item.body}</dd>
            </div>
          ))}
        </dl>
      </ContentSection>
      <ContentSection title="Your choices">
        <p>
          A cookie banner and a preferences link in the footer are planned.
          Optional analytics will not load before you accept them, and you will
          be able to withdraw consent at any time.
        </p>
        <p>
          You can also clear or block storage in your browser settings. Blocking
          essential items may stop sign-in from working.
        </p>
      </ContentSection>
      <ContentSection title="More information">
        <p>
          See the{" "}
          <Link href="/privacy" className={link}>
            privacy policy
          </Link>{" "}
          for how personal information is handled.
        </p>
      </ContentSection>
    </>
  );
}
