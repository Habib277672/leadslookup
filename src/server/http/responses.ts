import z from "zod";

export type ErrorCode =
  | "invalid_input"
  | "invalid_token"
  | "invalid_credentials"
  | "verification_required"
  | "account_suspended"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal";

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ data }, init);
}

export function fail(
  code: ErrorCode,
  message: string,
  status: number,
  headers?: HeadersInit,
): Response {
  return Response.json({ error: { code, message } }, { status, headers });
}

export function failValidation(error: z.ZodError): Response {
  const flat = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fields = Object.fromEntries(
    Object.entries(flat).flatMap(([key, messages]) =>
      messages?.[0] ? [[key, messages[0]]] : [],
    ),
  );
  return Response.json(
    {
      error: {
        code: "invalid_input",
        message: "Check the highlighted fields.",
        fields,
      },
    },
    { status: 400 },
  );
}
