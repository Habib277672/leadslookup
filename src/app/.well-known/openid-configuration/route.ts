import { getOpenIdConfiguration } from "@/server/auth/oidc";

export function GET() {
  return Response.json(getOpenIdConfiguration(), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
