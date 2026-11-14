"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useSubmit } from "./use-submit";
import {
  FormAlert,
  FormNotice,
  linkClass,
  SubmitButton,
  TextField,
} from "./ui";
import { notify } from "@/lib/notify";

function ResendForm() {
  const resend = useSubmit("/api/v1/auth/email/verification/resend");
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    const result = await resend.submit({ email });
    if (result.ok) {
      notify.success("New link requested.");
      setSent(true);
    }
  }

  if (sent) {
    return (
      <FormNotice>
        If that address is waiting for confirmation, we&apos;ve sent a new link.
      </FormNotice>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert
        message={
          resend.error && !resend.error.fields
            ? resend.error.message
            : undefined
        }
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        maxLength={254}
        disabled={resend.pending}
        error={resend.fieldError("email")}
      />
      <SubmitButton pending={resend.pending} pendingLabel="Sending…">
        Send a new link
      </SubmitButton>
    </form>
  );
}

export function VerifyEmailForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const confirm = useSubmit("/api/v1/auth/email/verification/confirm");

  async function onConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const result = await confirm.submit({ token });
    if (result.ok) {
      notify.success("Email confirmed. You're logged in.");
      router.replace("/dashboard");
    }
  }

  if (!token || confirm.error?.code === "invalid_token") {
    return (
      <div className="space-y-5">
        <FormAlert message="This link is missing, invalid or has expired." />
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a new one.
        </p>
        <ResendForm />
      </div>
    );
  }

  return (
    <form onSubmit={onConfirm} className="space-y-5">
      <FormAlert message={confirm.error?.message} />
      <SubmitButton pending={confirm.pending} pendingLabel="Confirming…">
        Confirm email address
      </SubmitButton>
      <p className="text-sm text-muted-foreground">
        Already confirmed?{" "}
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </form>
  );
}
