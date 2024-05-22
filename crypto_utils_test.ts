import { importVapidKeys } from "./vapid.ts";
import { forgeJwt } from "./crypto_utils.ts";
import { jose } from "./dev_deps.ts";

import vapidJwks from "./test_data/vapid.json" with { type: "json" };

Deno.test("forgeJwt", async () => {
  const vapidKeys = await importVapidKeys(vapidJwks);

  const jwt = await forgeJwt(vapidKeys.privateKey, {
    sub: "mailto:john@example.com",
    aud: "example.com",
    exp: 2716428940,
  });

  await jose.jwtVerify(jwt, vapidKeys.publicKey);
});
