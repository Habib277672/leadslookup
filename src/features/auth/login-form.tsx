"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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

export function LoginForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const login = useSubmit("/api/v1/auth/login");
  const resend = useSubmit("/api/v1/auth/email/verification/resend");
  const [resent, setResent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResent(false);
    const data = new FormData(event.currentTarget);
    const result = await login.submit({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    if (result.ok) {
      notify.success("Logged in.");
      router.replace("/dashboard");
    }
  }

  async function onResend() {
    if (!formRef.current) return;
    const email = String(new FormData(formRef.current).get("email") ?? "");
    const result = await resend.submit({ email });
    if (result.ok) {
      notify.success("New link requested.");
      setResent(true);
    }
  }

  const needsVerification = login.error?.code === "verification_required";

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
        <FormAlert
          message={
            login.error && !login.error.fields ? login.error.message : undefined
          }
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          disabled={login.pending}
          error={login.fieldError("email")}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          disabled={login.pending}
          error={login.fieldError("password")}
          labelAction={
            <Link href="/forgot-password" className={`${linkClass} text-sm`}>
              Forgot password?
            </Link>
          }
        />
        <SubmitButton pending={login.pending} pendingLabel="Logging in…">
          Log in
        </SubmitButton>
      </form>

      {needsVerification ? (
        <div className="space-y-3">
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
                Send a new confirmation link
              </Button>
            </>
          )}
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        New to LeadsLookup?{" "}
        <Link href="/register" className={linkClass}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
