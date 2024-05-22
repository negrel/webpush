import { PushSubscription } from "./push_subscription.ts";
import { bytes, decodeBase64Url, encodeBase64Url } from "./deps.ts";
import * as ece from "@negrel/http-ece";
import * as jose from "npm:jose";

const encoder = new TextEncoder();

async function hmacSha256Digest(
  crypto: SubtleCrypto,
  secret: CryptoKey | ArrayBuffer,
  body: BufferSource,
  length?: number,
): Promise<ArrayBuffer> {
  console.log("hmac secret", secret);

  if (secret instanceof ArrayBuffer) {
    console.log("importing secret for hmac");
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

  console.log(secret);
  const result = await crypto.sign("HMAC", secret, body);

  if (length !== null) return result.slice(0, length);

  return result;
}

function hkdfSha256Extract(
  crypto: SubtleCrypto,
  salt: ArrayBuffer,
  ikm: ArrayBuffer,
) {
  if (salt.byteLength === 0) {
    salt = new Uint8Array(256).fill(0).buffer.slice(0);
  }

  return hmacSha256Digest(crypto, salt, ikm);
}

async function hkdfSha256Expand(
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

async function ecdh(
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

export async function pushMessage(
  crypto: SubtleCrypto,
  asKeys: CryptoKeyPair,
  vapidKeys: CryptoKeyPair,
  sub: PushSubscription,
  message: ArrayBuffer,
) {
  const authSecret = decodeBase64Url(sub.keys.auth);
  const uaPublic = decodeBase64Url(sub.keys.p256dh);
  const uaPublicKey = await crypto.importKey(
    "raw",
    uaPublic,
    {
      "name": "ECDH",
      namedCurve: "P-256",
    },
    true,
    [],
  );

  const ecdhSecret = await ecdh(crypto, {
    privateKey: asKeys.privateKey,
    publicKey: uaPublicKey,
  });

  const prkKey = await hkdfSha256Extract(
    crypto,
    authSecret.buffer.slice(0),
    ecdhSecret,
  );

  const asPublic = new Uint8Array(
    await crypto.exportKey("raw", asKeys.publicKey),
  );

  const keyInfo = bytes.concat([
    encoder.encode("WebPush: info\0"),
    uaPublic,
    asPublic,
  ]);

  const ikm = await hkdfSha256Expand(
    crypto,
    prkKey,
    bytes.concat([keyInfo, ece.ONE_BYTE]),
    32,
  );

  const jwt = await new jose.SignJWT({
    sub: "mailto:alexandre@negrel.dev",
    aud: new URL(sub.endpoint).origin,
    exp: 1716428940,
  }).setProtectedHeader({ typ: "JWT", alg: "ES256" }).sign(
    vapidKeys.privateKey,
  );

  const pubKeyRaw = await crypto.exportKey("raw", vapidKeys.publicKey);
  console.log(new Uint8Array(pubKeyRaw).at(0));
  console.log(pubKeyRaw.byteLength);

  const eceRecord = await ece.encrypt(message, ikm, {
    header: {
      rs: 4096,
      keyid: asPublic,
      salt: decodeBase64Url("gP9-2rLHHqVoXa1oAwrdkw"),
    },
  });
  const reqInit = {
    method: "POST",
    headers: {
      "Content-Length": eceRecord.byteLength,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "Urgency": "normal",
      TTL: "2419200",
      Authorization: `vapid t=${jwt}, k=${
        encodeBase64Url(await crypto.exportKey("raw", vapidKeys.publicKey))
      }`,
    },
    body: eceRecord,
  };
  console.log(reqInit, encodeBase64Url(eceRecord));
  const response = await fetch(sub.endpoint, reqInit);

  return response;
}
