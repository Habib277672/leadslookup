"use client";

import { LogOut, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/features/auth/logout-button";

export type ShellUser = {
  displayName: string | null;
  email: string;
  themePreference: "system" | "light" | "dark";
};

export function UserMenu({ user }: { user: ShellUser }) {
  const { signOut, busy } = useSignOut();
  const name = user.displayName?.trim() || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="lg"
          className="max-w-48"
          aria-label={`Account menu for ${name}`}
        >
          <span className="truncate">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-0.5 font-normal">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy}
          onSelect={() => signOut("/api/v1/auth/logout", "Logged out.")}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy}
          onSelect={() =>
            signOut("/api/v1/auth/logout-all", "Logged out of all devices.")
          }
        >
          <LogOutIcon /> Log out everywhere
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
