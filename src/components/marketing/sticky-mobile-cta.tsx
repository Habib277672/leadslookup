"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

const HIDE_WHEN_VISIBLE = ["#hero-cta", "#closing-cta", "footer"];

export function StickyMobileCta() {
  const [hidden, setHidden] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setHidden(visible.size > 0);
    });
    for (const selector of HIDE_WHEN_VISIBLE) {
      const el = document.querySelector(selector);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  if (dismissed || hidden) return null;

  return (
    <div
      role="region"
      aria-label="Create an account"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden print:hidden"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <Link
          href="/register"
          className={buttonVariants({
            size: "lg",
            className: "h-11 flex-1 text-base",
          })}
        >
          Create an account
        </Link>
        <Button
          variant="ghost"
          className="size-11"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
