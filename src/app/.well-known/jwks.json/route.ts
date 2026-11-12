import { connection } from "next/server";
import { getJwks } from "@/server/auth/oidc";

export async function GET() {
  await connection(); // read the key at request time, not at build time
  return Response.json(await getJwks(), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
