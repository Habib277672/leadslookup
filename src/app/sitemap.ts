import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const paths = [
  "/",
  "/features",
  "/how-it-works",
  "/data-sources",
  "/faq",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
];

// The thank-you page is deliberately left out (noindex).
export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `${siteConfig.url}${path}` }));
}
