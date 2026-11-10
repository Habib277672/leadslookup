"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "./actions";
import type { ContactField, ContactState } from "./schema";

const initialState: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialState);

  const error = (f: ContactField) => state.fieldErrors?.[f];
  const value = (f: ContactField) => state.values?.[f] ?? "";
  const props = (f: ContactField) => ({
    id: f,
    name: f,
    defaultValue: value(f),
    disabled: pending,
    required: true,
    "aria-invalid": error(f) ? true : undefined,
    "aria-describedby": error(f) ? `${f}-error` : undefined,
  });

  return (
    <form action={action} className="max-w-xl space-y-5" noValidate>
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input {...props("name")} autoComplete="name" maxLength={100} />
        <FieldError id="name-error" message={error("name")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          {...props("email")}
          type="email"
          autoComplete="email"
          maxLength={254}
        />
        <FieldError id="email-error" message={error("email")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input {...props("subject")} maxLength={150} />
        <FieldError id="subject-error" message={error("subject")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea {...props("message")} rows={6} maxLength={5000} />
        <FieldError id="message-error" message={error("message")} />
      </div>

      {/* Honeypot, hidden from people and assistive tech. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}
