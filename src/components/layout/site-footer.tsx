import Link from "next/link";
import { cacheLife } from "next/cache";
import { footerNav, siteConfig } from "@/config/site";
import { CookiePreferencesButton } from "@/features/consent/cookie-preferences-button";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_2fr]">
        <div className="max-w-sm">
          <p className="text-base font-semibold tracking-tight">
            {siteConfig.name}
          </p>
          <p className="mt-3 text-sm text-text-secondary">
            Find businesses by category and location, then keep track of the
            ones worth contacting.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-8 sm:grid-cols-3"
        >
          {Object.entries(footerNav).map(([heading, links]) => (
            <div key={heading}>
              <h2 className="text-sm font-semibold">{heading}</h2>
              <ul className="mt-3 space-y-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-8 items-center rounded-md text-sm text-text-secondary outline-none hover:text-text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="flex border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-sm text-text-secondary sm:px-6">
          © <CopyrightYear /> {siteConfig.name}
        </p>
        <CookiePreferencesButton className="inline-flex min-h-11 w-50 items-center text-sm text-text-secondary hover:text-text-primary" />
      </div>
    </footer>
  );
}
