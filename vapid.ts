/**
 * Output of exportVapidKeys() that can be stored serialized in JSON and stored.
 */
export interface ExportedVapidKeys {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

const vapidKeysAlgo = {
  name: "ECDSA",
  namedCurve: "P-256",
};

/**
 * Generates a new pair of VAPID keys.
 * See https://www.rfc-editor.org/rfc/rfc8292.
 */
export async function generateVapidKeys(
  { extractable = false, crypto = globalThis.crypto.subtle }: {
    extractable?: boolean;
    crypto?: SubtleCrypto;
  } = {},
): Promise<CryptoKeyPair> {
  return await crypto.generateKey(
    vapidKeysAlgo,
    extractable,
    ["sign", "verify"],
  );
}

/**
 * Import VAPID keys previously exported using exportVapidKeys() (JWK format).
 */
export async function importVapidKeys(
  exportedKeys: ExportedVapidKeys,
  { crypto = globalThis.crypto.subtle, extractable = false }: {
    crypto?: SubtleCrypto;
    extractable?: boolean;
  } = {},
): Promise<CryptoKeyPair> {
  return {
    publicKey: await crypto.importKey(
      "jwk",
      exportedKeys.publicKey,
      vapidKeysAlgo,
      true,
      ["verify"],
    ),
    privateKey: await crypto.importKey(
      "jwk",
      exportedKeys.privateKey,
      vapidKeysAlgo,
      extractable,
      ["sign"],
    ),
  };
}

/**
 * Export VAPID keys in JWK format.
 */
export async function exportVapidKeys(
  keys: CryptoKeyPair,
  { crypto = globalThis.crypto.subtle }: { crypto?: SubtleCrypto } = {},
): Promise<ExportedVapidKeys> {
  return {
    publicKey: await crypto.exportKey("jwk", keys.publicKey),
    privateKey: await crypto.exportKey("jwk", keys.privateKey),
  };
}
