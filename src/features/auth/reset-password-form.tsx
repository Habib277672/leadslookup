"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useSubmit } from "./use-submit";
import {
  FormAlert,
  FormNotice,
  linkClass,
  SubmitButton,
  TextField,
} from "./ui";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const reset = useSubmit("/api/v1/auth/password/reset");
  const [done, setDone] = useState(false);
  const [mismatch, setMismatch] = useState<string>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirm") ?? "")) {
      setMismatch("The two passwords don't match.");
      return;
    }
    setMismatch(undefined);
    const result = await reset.submit({ token, password });
    if (result.ok) setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <FormNotice>
          Your password was changed and you were signed out everywhere. Log in
          with the new one.
        </FormNotice>
        <p>
          <Link href="/login" className={linkClass}>
            Go to log in
          </Link>
        </p>
      </div>
    );
  }

  if (!token || reset.error?.code === "invalid_token") {
    return (
      <div className="space-y-4">
        <FormAlert message="This link is missing, invalid or has expired." />
        <p>
          <Link href="/forgot-password" className={linkClass}>
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert
        message={
          reset.error && !reset.error.fields ? reset.error.message : undefined
        }
      />
      <TextField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        maxLength={128}
        hint="At least 10 characters."
        disabled={reset.pending}
        error={reset.fieldError("password")}
      />
      <TextField
        label="Confirm new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        maxLength={128}
        disabled={reset.pending}
        error={mismatch}
      />
      <SubmitButton pending={reset.pending} pendingLabel="Saving…">
        Set new password
      </SubmitButton>
    </form>
  );
}
