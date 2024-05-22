import { generateVapidKeys, importVapidKeys } from "./vapid.ts";
import { assert, assertEquals } from "./dev_deps.ts";
import { exportVapidKeys } from "./vapid.ts";

function assertValidVapidKeyPair(keys: CryptoKeyPair, extractable: boolean) {
  assert(keys.privateKey.extractable === extractable);
  assertEquals(keys.privateKey.algorithm as unknown, {
    name: "ECDSA",
    namedCurve: "P-256",
  });
  assertEquals(keys.privateKey.usages, ["sign"]);
  assertEquals(keys.privateKey.type, "private");

  assert(keys.publicKey.extractable); // Always extractable.
  assertEquals(keys.publicKey.algorithm as unknown, {
    name: "ECDSA",
    namedCurve: "P-256",
  });
  assertEquals(keys.publicKey.usages, ["verify"]);
  assertEquals(keys.publicKey.type, "public");
}

Deno.test("generateVapidKeys/notExtractable", async () => {
  const keys = await generateVapidKeys();
  assertValidVapidKeyPair(keys, false);
});

Deno.test("generateVapidKeys/extractable", async () => {
  const keys = await generateVapidKeys({ extractable: true });
  assertValidVapidKeyPair(keys, true);
});

Deno.test("vapidKeys/import/export", async () => {
  const keys = await generateVapidKeys({ extractable: true });
  const exportedKeys = await exportVapidKeys(keys);
  const importedKeys = await importVapidKeys(exportedKeys, {
    extractable: true,
  });
  assertValidVapidKeyPair(importedKeys, true);
  assertEquals(keys, importedKeys);
});
