"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { postJson, type ApiError, type ApiResult } from "./client";

/**
 * `pending` stays true after a successful submit on purpose: the form is about
 * to navigate or be replaced, and this prevents double submits.
 * Field-level errors stay inline; every other error also shows a toast.
 */
export function useSubmit<T = unknown>(path: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function submit(body?: unknown): Promise<ApiResult<T>> {
    setPending(true);
    setError(null);
    const result = await postJson<T>(path, body);
    if (!result.ok) {
      setError(result);
      setPending(false);
      if (!result.fields) notify.error(result.message);
    }
    return result;
  }

  return {
    pending,
    error,
    submit,
    fieldError: (name: string) => error?.fields?.[name],
  };
}
