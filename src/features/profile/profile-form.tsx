"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FormAlert, SubmitButton, TextField } from "@/features/auth/ui";
import { useSubmit } from "@/features/auth/use-submit";
import { notify } from "@/lib/notify";

export function ProfileForm({ displayName }: { displayName: string | null }) {
  const router = useRouter();
  const update = useSubmit("/api/v1/me", "PATCH");
  const [refreshing, startRefresh] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get("displayName") ?? "",
    ).trim();
    const result = await update.submit({ displayName: value });
    if (result.ok) {
      notify.success("Profile saved.");
      startRefresh(() => router.refresh()); // updates the name in the header
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-5">
      <FormAlert
        message={
          update.error && !update.error.fields
            ? update.error.message
            : undefined
        }
      />
      <TextField
        label="Display name"
        name="displayName"
        autoComplete="name"
        maxLength={80}
        defaultValue={displayName ?? ""}
        hint="2 to 80 characters. Shown in the dashboard header."
        disabled={update.pending}
        error={update.fieldError("displayName")}
      />
      <SubmitButton
        pending={update.pending || refreshing}
        pendingLabel="Saving…"
      >
        Save changes
      </SubmitButton>
    </form>
  );
}
