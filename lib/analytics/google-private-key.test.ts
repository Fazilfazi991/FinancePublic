import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { normalizeGooglePrivateKey, validateGooglePrivateKey } from "./google-private-key";

const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "pem", type: "pkcs8" }).toString();

describe("Google private-key normalization", () => {
  it.each([
    ["multiline PEM", pem],
    ["literal escaped newlines", pem.replace(/\n/g, "\\n")],
    ["literal escaped CRLF", pem.replace(/\n/g, "\\r\\n")],
    ["actual CRLF", pem.replace(/\n/g, "\r\n")],
    ["surrounding double quotes", `"${pem.replace(/\n/g, "\\n")}"`],
    ["surrounding single quotes", `'${pem.replace(/\n/g, "\\n")}'`],
  ])("accepts %s", (_label, input) => expect(validateGooglePrivateKey(input)).toBe(normalizeGooglePrivateKey(pem)));

  it("returns only a safe validation error for malformed values", () => {
    expect(() => validateGooglePrivateKey('"not a private key"')).toThrow("Google service-account private key is not valid PEM data.");
  });
});
