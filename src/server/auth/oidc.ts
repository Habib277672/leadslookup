import "server-only";
import { authConfig } from "./config";
import { getKeys } from "./keys";

export async function getJwks() {
  const { publicJwk } = await getKeys();
  return { keys: [publicJwk] };
}

export function getOpenIdConfiguration() {
  return {
    issuer: authConfig.issuer,
    jwks_uri: `${authConfig.issuer}/.well-known/jwks.json`,
    id_token_signing_alg_values_supported: ["RS256"],
    subject_types_supported: ["public"],
    response_types_supported: ["id_token"],
  };
}
