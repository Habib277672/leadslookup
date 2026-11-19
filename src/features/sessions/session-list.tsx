"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/shared/local-time";
import { deleteJson } from "@/features/auth/client";
import { useSignOut } from "@/features/auth/logout-button";
import { notify } from "@/lib/notify";

export type SessionItem = {
  id: string;
  device: string;
  ipAddress: string | null;
  lastActive: string;
  signedInAt: string;
  current: boolean;
};

function Row({ item }: { item: SessionItem }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  async function revoke() {
    setPending(true);
    const result = await deleteJson(`/api/v1/me/sessions/${item.id}`);
    setPending(false);
    if (!result.ok) {
      notify.error(result.message);
      if (result.code === "not_found") startRefresh(() => router.refresh());
      return;
    }
    notify.success("Device signed out.");
    startRefresh(() => router.refresh());
  }

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="break-words">{item.device}</span>
          {item.current ? (
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-xs font-normal">
              This device
            </span>
          ) : null}
        </p>
        <p className="text-sm text-muted-foreground">
          Last active <LocalTime iso={item.lastActive} />. Signed in{" "}
          <LocalTime iso={item.signedInAt} />.
          {item.ipAddress ? ` IP address ${item.ipAddress}.` : ""}
        </p>
      </div>
      {item.current ? null : (
        <Button
          variant="outline"
          size="lg"
          disabled={pending || refreshing}
          aria-label={`Sign out ${item.device}`}
          onClick={revoke}
        >
          Sign out
        </Button>
      )}
    </li>
  );
}

export function SessionList({ items }: { items: SessionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No active sessions found.</p>
    );
  }
  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <Row key={item.id} item={item} />
      ))}
    </ul>
  );
}

export function LogoutEverywhereButton() {
  const { signOut, busy } = useSignOut();
  return (
    <Button
      variant="outline"
      size="lg"
      disabled={busy}
      onClick={() =>
        signOut("/api/v1/auth/logout-all", "Logged out of all devices.")
      }
    >
      Log out everywhere
    </Button>
  );
}
