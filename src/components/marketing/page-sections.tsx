import type { ReactNode } from "react";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border">
      <div className={`${container} py-10 sm:py-16`}>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-prose text-base text-text-secondary sm:text-lg">
          {description}
        </p>
        {children ? (
          <div className="mt-8 flex flex-wrap gap-3">{children}</div>
        ) : null}
      </div>
    </section>
  );
}

export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border">
      <div
        className={`${container} grid gap-6 py-12 sm:py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}
      >
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <div className="space-y-4 text-text-secondary">{children}</div>
      </div>
    </section>
  );
}

export function CtaSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className={`${container} py-12 sm:py-16`}>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-prose text-text-secondary">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">{children}</div>
      </div>
    </section>
  );
}
