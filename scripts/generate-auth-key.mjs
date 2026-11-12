import { generateKeyPairSync } from "node:crypto";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" });
console.log(`AUTH_JWT_PRIVATE_KEY_B64=${Buffer.from(pem).toString("base64")}`);