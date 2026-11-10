"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { deliverContactMessage } from "./deliver";
import { contactSchema, type ContactField, type ContactState } from "./schema";

const fields: ContactField[] = ["name", "email", "subject", "message"];

export async function submitContact(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: real users never see or fill this field.
  if (String(formData.get("company") ?? "") !== "") {
    redirect("/contact/thank-you");
  }

  const values = Object.fromEntries(
    fields.map((f) => [f, String(formData.get(f) ?? "")]),
  ) as Record<ContactField, string>;

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors;
    const fieldErrors = Object.fromEntries(
      fields.flatMap((f) => (flat[f]?.[0] ? [[f, flat[f][0]]] : [])),
    );
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors,
      values,
    };
  }

  const result = await deliverContactMessage(parsed.data);
  if (!result.ok) {
    return {
      status: "error",
      message:
        "The contact form can't deliver messages yet. Please try again later.",
      values,
    };
  }

  redirect("/contact/thank-you");
}
