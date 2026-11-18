import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppearanceForm } from "@/features/profile/appearance-form";
import { ProfileForm } from "@/features/profile/profile-form";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = { title: "Settings" };

async function Sections() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?_r=1");

  return (
    <div className="space-y-12">
      <section aria-labelledby="profile-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="profile-heading" className="text-lg font-semibold">
            Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="text-foreground">{user.email}</span>.
            The email address can't be changed here.
          </p>
        </div>
        <ProfileForm displayName={user.displayName} />
      </section>

      <section aria-labelledby="appearance-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="appearance-heading" className="text-lg font-semibold">
            Appearance
          </h2>
          <p className="text-sm text-muted-foreground">
            Saved to your account, so it follows you to other devices.
          </p>
        </div>
        <AppearanceForm initial={user.themePreference} />
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <Sections />
      </Suspense>
    </div>
  );
}
