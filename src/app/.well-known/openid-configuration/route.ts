import { connection } from "next/server";
import { getOpenIdConfiguration } from "@/server/auth/oidc";

export async function GET() {
  await connection(); // read AUTH_ISSUER at request time, not at build time
  return Response.json(getOpenIdConfiguration(), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
