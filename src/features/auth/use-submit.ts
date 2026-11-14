"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { postJson, type ApiError, type ApiResult } from "./client";

/**
 * `pending` covers only the request itself. Pages kept alive by Next's router
 * cache keep their state, so a flag left on after success would come back
 * frozen. Callers that navigate on success use useTransition to block
 * double submits until the navigation finishes.
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
      if (!result.fields) notify.error(result.message);
    }
    setPending(false);
    return result;
  }

  return {
    pending,
    error,
    submit,
    fieldError: (name: string) => error?.fields?.[name],
  };
}
