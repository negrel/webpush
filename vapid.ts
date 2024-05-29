export interface ExportedVapidKeys {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

const vapidKeysAlgo = {
  name: "ECDSA",
  namedCurve: "P-256",
};

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

export async function exportVapidKeys(
  keys: CryptoKeyPair,
  { crypto = globalThis.crypto.subtle }: { crypto?: SubtleCrypto } = {},
): Promise<ExportedVapidKeys> {
  return {
    publicKey: await crypto.exportKey("jwk", keys.publicKey),
    privateKey: await crypto.exportKey("jwk", keys.privateKey),
  };
}
