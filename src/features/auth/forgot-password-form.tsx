"use client";

import Link from "next/link";
import { useState } from "react";
import { useSubmit } from "./use-submit";
import {
  FormAlert,
  FormNotice,
  linkClass,
  SubmitButton,
  TextField,
} from "./ui";

export function ForgotPasswordForm() {
  const forgot = useSubmit<{ message: string }>("/api/v1/auth/password/forgot");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    const result = await forgot.submit({ email });
    if (result.ok) setMessage(result.data.message);
  }

  if (message) {
    return (
      <div className="space-y-4">
        <FormNotice>
          {message} The link works once and expires in 30 minutes.
        </FormNotice>
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className={linkClass}>
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormAlert
          message={
            forgot.error && !forgot.error.fields
              ? forgot.error.message
              : undefined
          }
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          disabled={forgot.pending}
          error={forgot.fieldError("email")}
        />
        <SubmitButton pending={forgot.pending} pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </form>
      <p className="text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </div>
  );
}
