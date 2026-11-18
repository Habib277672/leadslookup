import "dotenv/config";
import { createPrivateKey, createPublicKey, randomUUID } from "node:crypto";
import { SignJWT, calculateJwkThumbprint, exportJWK } from "jose";

function need(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Missing ${name} (set it in .env or the shell).`);
        process.exit(1);
    }
    return value;
}

const issuer = need("AUTH_ISSUER");
const supabaseUrl = need("SUPABASE_URL").replace(/\/$/, "");
const publishableKey = need("SUPABASE_PUBLISHABLE_KEY");
const privateKey = createPrivateKey(
    Buffer.from(need("AUTH_JWT_PRIVATE_KEY_B64"), "base64").toString("utf8"),
);
const kid = await calculateJwkThumbprint(await exportJWK(createPublicKey(privateKey)), "sha256");

const iat = Math.floor(Date.now() / 1000);
const token = await new SignJWT({ role: "authenticated", sid: randomUUID(), token_use: "access" })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(issuer)
    .setAudience("authenticated")
    .setSubject(randomUUID())
    .setIssuedAt(iat)
    .setExpirationTime(iat + 300)
    .sign(privateKey);

async function probe(label, extraHeaders) {
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
        headers: { apikey: publishableKey, ...extraHeaders },
    });
    const body = (await response.text()).slice(0, 220);
    console.log(`${label}: HTTP ${response.status} ${body}`);
    return response.status;
}

console.log(`issuer used: ${issuer}`);
console.log(`kid: ${kid}`);
await probe("control (publishable key only)", {});
const status = await probe("with our token      ", { Authorization: `Bearer ${token}` });

if (status === 401) {
    console.log("\nRESULT: NOT TRUSTED. Supabase rejected the token (issuer not registered, wrong issuer URL, or JWKS unreachable).");
} else if (status === 403 || status === 200) {
    console.log("\nRESULT: TRUSTED. Supabase accepted the token. (403 'permission denied' is the expected safe state: the locked tables are not readable yet.)");
} else {
    console.log("\nRESULT: unexpected status. Paste the lines above.");
}