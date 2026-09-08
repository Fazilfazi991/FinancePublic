import "server-only";

import { createPrivateKey } from "node:crypto";

const HEADER = "-----BEGIN PRIVATE KEY-----";
const FOOTER = "-----END PRIVATE KEY-----";
const INVALID_KEY = "Google service-account private key is not valid PEM data.";

export function normalizeGooglePrivateKey(value: string) {
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) key = key.slice(1, -1);
  return key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

export function validateGooglePrivateKey(value: string) {
  const key = normalizeGooglePrivateKey(value);
  const body = key.slice(HEADER.length, key.length - FOOTER.length).replace(/\s/g, "");
  if (!key.startsWith(HEADER) || !key.endsWith(FOOTER) || !body) throw new Error(INVALID_KEY);
  try {
    createPrivateKey({ key, format: "pem", type: "pkcs8" });
  } catch {
    throw new Error(INVALID_KEY);
  }
  return key;
}
