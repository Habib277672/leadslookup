import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Your private workspace for finding and tracking business prospects.
        </p>
      </header>

      <section aria-labelledby="status-heading" className="max-w-2xl">
        <h2 id="status-heading" className="text-base font-semibold">
          What is available right now
        </h2>
        <dl className="mt-3 divide-y divide-border border-y border-border text-sm">
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt>Account and sign-in</dt>
            <dd className="text-muted-foreground">Available</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt>Find leads</dt>
            <dd className="text-muted-foreground">
              Not available yet. It needs imported location and business data.
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt>Saved leads, notes and outreach status</dt>
            <dd className="text-muted-foreground">Not available yet</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
