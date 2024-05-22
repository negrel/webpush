import { importVapidKeys } from "./vapid.ts";
import vapidJson from "./vapid.json" with { type: "json" };
import { decodeBase64Url } from "./deps.ts";

Deno.test("importVapidKeys", async () => {
  const vapidKeysObj = {
    publicKey: decodeBase64Url(vapidJson.publicKey).buffer.slice(0),
    privateKey: decodeBase64Url(vapidJson.privateKey).buffer.slice(0),
  };
  const keys = await importVapidKeys(crypto.subtle, vapidKeysObj);
  console.log(keys);
});
