import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { describeDevice } from "@/features/sessions/device";
import { listActiveSessions } from "@/features/sessions/service";
import {
  LogoutEverywhereButton,
  SessionList,
} from "@/features/sessions/session-list";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = { title: "Security" };

async function Sessions() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?_r=1");

  const sessions = await listActiveSessions(user.id);
  const items = sessions.map((s) => ({
    id: s.id,
    device: describeDevice(s.userAgent),
    ipAddress: s.ipAddress,
    lastActive: (s.lastUsedAt ?? s.createdAt).toISOString(),
    signedInAt: s.createdAt.toISOString(),
    current: s.id === user.sessionId,
  }));

  return (
    <section aria-labelledby="sessions-heading" className="max-w-2xl space-y-4">
      <div className="space-y-1">
        <h2 id="sessions-heading" className="text-lg font-semibold">
          Active sessions
        </h2>
        <p className="text-sm text-muted-foreground">
          Devices currently signed in to your account. Sign out any you don{"'"}
          t recognise. If you see one that isn{"'"}t yours, change your password
          too.
        </p>
      </div>
      <SessionList items={items} />
      <LogoutEverywhereButton />
    </section>
  );
}

export default function SecurityPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <Sessions />
      </Suspense>
    </div>
  );
}
