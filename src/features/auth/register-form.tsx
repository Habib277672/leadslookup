"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSubmit } from "./use-submit";
import {
  FormAlert,
  FormNotice,
  linkClass,
  SubmitButton,
  TextField,
} from "./ui";
import { notify } from "@/lib/notify";

export function RegisterForm() {
  const register = useSubmit("/api/v1/auth/register");
  const resend = useSubmit("/api/v1/auth/email/verification/resend");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const result = await register.submit({
      displayName: String(data.get("displayName") ?? ""),
      email,
      password: String(data.get("password") ?? ""),
    });
    if (result.ok) {
      notify.success("Almost there. Check your email.");
      setSentTo(email);
    }
  }

  async function onResend() {
    if (!sentTo) return;
    const result = await resend.submit({ email: sentTo });
    if (result.ok) {
      notify.success("New link requested.");
      setResent(true);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <FormNotice>
          If <span className="font-medium">{sentTo}</span> can be registered,
          we&apos;ve sent a confirmation link. It works once and expires in 24
          hours.
        </FormNotice>
        {resent ? (
          <FormNotice>
            If that address is waiting for confirmation, we&apos;ve sent a new
            link.
          </FormNotice>
        ) : (
          <>
            <FormAlert message={resend.error?.message} />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onResend}
              disabled={resend.pending}
            >
              Send the link again
            </Button>
          </>
        )}
        <p className="text-sm text-muted-foreground">
          Wrong address?{" "}
          <button
            type="button"
            className={linkClass}
            onClick={() => setSentTo(null)}
          >
            Start again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormAlert
          message={
            register.error && !register.error.fields
              ? register.error.message
              : undefined
          }
        />
        <TextField
          label="Name"
          name="displayName"
          autoComplete="name"
          maxLength={80}
          disabled={register.pending}
          error={register.fieldError("displayName")}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          disabled={register.pending}
          error={register.fieldError("email")}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          hint="At least 10 characters. A few random words work well."
          disabled={register.pending}
          error={register.fieldError("password")}
        />
        <SubmitButton
          pending={register.pending}
          pendingLabel="Creating account…"
        >
          Create account
        </SubmitButton>
      </form>
      <p className="text-sm text-muted-foreground">
        By creating an account you accept the{" "}
        <Link href="/terms" className={linkClass}>
          Terms
        </Link>{" "}
        and the{" "}
        <Link href="/privacy" className={linkClass}>
          Privacy Policy
        </Link>
        .
      </p>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </div>
  );
}
