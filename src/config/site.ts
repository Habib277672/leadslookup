const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export const siteConfig = {
  name: "LeadsLookup",
  description:
    "Find businesses by category and location, save the promising ones, and keep your outreach organized.",
  url: envUrl ?? "http://localhost:3000",
  indexable: Boolean(envUrl),
} as const;

export const mainNav = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Data sources", href: "/data-sources" },
    { label: "FAQ", href: "/faq" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms and conditions", href: "/terms" },
    { label: "Cookie policy", href: "/cookies" },
  ],
} as const;
