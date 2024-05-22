import { exportVapidKeys, generateVapidKeys } from "../vapid.ts";

const keys = await generateVapidKeys({ extractable: true });

const vapidJwks = await exportVapidKeys(keys);
console.log(JSON.stringify(vapidJwks, undefined, "  "));
