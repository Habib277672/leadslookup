"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, LayoutDashboard, Search, Settings } from "lucide-react";
import type { ComponentType } from "react";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
  soon?: boolean;
};

const items: Item[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  {
    href: "/dashboard/find-leads",
    label: "Find leads",
    icon: Search,
  },
  {
    href: "/dashboard/saved-leads",
    label: "Saved leads",
    icon: Bookmark,
    soon: true,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    soon: true,
  },
];

const base =
  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function NavList({ inSheet = false }: { inSheet?: boolean }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {items.map(({ href, label, icon: Icon, exact, soon }) => {
        if (soon) {
          return (
            <li key={href}>
              <span
                aria-disabled="true"
                className={cn(base, "cursor-not-allowed text-muted-foreground")}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 truncate">{label}</span>
                <span className="text-xs">Soon</span>
              </span>
            </li>
          );
        }
        const active = exact ? pathname === href : pathname.startsWith(href);
        const link = (
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              base,
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        );
        return (
          <li key={href}>
            {inSheet ? <SheetClose asChild>{link}</SheetClose> : link}
          </li>
        );
      })}
    </ul>
  );
}
