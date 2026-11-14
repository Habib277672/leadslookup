"use client";

import { useState } from "react";
import { postJson, type ApiError, type ApiResult } from "./client";

/**
 * `pending` stays true after a successful submit on purpose: the form is about
 * to navigate or be replaced, and this prevents double submits.
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
