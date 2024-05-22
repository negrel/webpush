import { encodeBase64Url } from "./deps.ts";

export async function generateVapidKeys(
  extractable: boolean,
  subtleCrypto?: SubtleCrypto,
): Promise<CryptoKeyPair> {
  const crypto = subtleCrypto ?? globalThis.crypto.subtle;

  return await crypto.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    extractable,
    ["sign", "verify"],
  );
}

export async function importVapidKeys(
  { publicKey, privateKey }: {
    publicKey: ArrayBuffer;
    privateKey: ArrayBuffer;
  },
  { crypto = globalThis.crypto.subtle, extractable = false }: {
    crypto?: SubtleCrypto;
    extractable?: boolean;
  },
): Promise<CryptoKeyPair> {
  const x = publicKey.slice(1, 32 + 1);
  const y = publicKey.slice(32 + 1);

  const jwkKey = {
    crv: "P-256",
    d: encodeBase64Url(privateKey),
    kty: "EC",
    x: encodeBase64Url(x),
    y: encodeBase64Url(y),
  };

  const pubKey = await crypto.importKey(
    "raw",
    publicKey,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );

  const privKey = await crypto.importKey(
    "jwk",
    jwkKey,
    { name: "ECDSA", namedCurve: "P-256" },
    extractable,
    ["sign"],
  );

  return {
    publicKey: pubKey,
    privateKey: privKey,
  };
}
