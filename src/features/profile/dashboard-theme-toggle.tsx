"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useThemeSync } from "./use-theme-sync";

export function DashboardThemeToggle() {
  const { choose } = useThemeSync();
  return <ThemeToggle onSelect={choose} />;
}
