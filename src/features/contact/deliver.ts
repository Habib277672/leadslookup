import type { ContactInput } from "./schema";

type DeliveryResult = { ok: true } | { ok: false };

// Placeholder transport. Replaced by a database insert in Phase 2.
export async function deliverContactMessage(
  input: ContactInput,
): Promise<DeliveryResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false };
  }
  console.info("[contact] message received (dev only, not stored):", input);
  return { ok: true };
}
