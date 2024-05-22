import { bytes, encodeBase64Url } from "./deps.ts";

export async function hmacSha256Digest(
  crypto: SubtleCrypto,
  secret: CryptoKey | ArrayBuffer,
  body: BufferSource,
  length?: number,
): Promise<ArrayBuffer> {
  if (secret instanceof ArrayBuffer) {
    secret = await crypto.importKey(
      "raw",
      secret,
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );
  }

  const result = await crypto.sign("HMAC", secret, body);

  if (length !== null) return result.slice(0, length);

  return result;
}

export function hkdfSha256Extract(
  crypto: SubtleCrypto,
  salt: ArrayBuffer,
  ikm: ArrayBuffer,
) {
  if (salt.byteLength === 0) {
    salt = new Uint8Array(256).fill(0).buffer.slice(0);
  }

  return hmacSha256Digest(crypto, salt, ikm);
}

export async function hkdfSha256Expand(
  crypto: SubtleCrypto,
  prk: ArrayBuffer,
  info: ArrayBuffer,
  length: number,
) {
  const infoBytes = new Uint8Array(info);

  let t = new Uint8Array(0);
  let okm = new Uint8Array(0);
  let i = 0;
  while (okm.byteLength < length) {
    i++;
    t = new Uint8Array(
      await hmacSha256Digest(crypto, prk, bytes.concat([t, infoBytes])),
    );
    okm = bytes.concat([okm, t]);
  }

  return okm.slice(0, length);
}

export async function ecdh(
  crypto: SubtleCrypto,
  { privateKey, publicKey }: CryptoKeyPair,
) {
  const ecdhKey = await crypto.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );

  return crypto.exportKey("raw", ecdhKey);
}

const encoder = new TextEncoder();

export async function forgeJwt(
  key: CryptoKey,
  // deno-lint-ignore no-explicit-any
  payload: Record<string, any>,
  { crypto = globalThis.crypto.subtle }: { crypto?: SubtleCrypto } = {},
): Promise<string> {
  const jwt = [{ typ: "JWT", alg: "ES256" }, payload].map((p) =>
    encodeBase64Url(JSON.stringify(p))
  ).join(".");

  const digest = await crypto.sign(
    { "name": "ECDSA", "hash": "SHA-256" },
    key,
    encoder.encode(jwt),
  );

  const signature = encodeBase64Url(digest);

  return jwt + "." + signature;
}
