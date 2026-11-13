export function logError(scope: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${scope}]`, error);
    return;
  }
  // Production: name and code only, never messages that might carry user data.
  const name = error instanceof Error ? error.name : "UnknownError";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  console.error(`[${scope}] ${name}${code ? ` ${code}` : ""}`);
}
