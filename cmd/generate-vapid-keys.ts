import {
  exportApplicationServerKey,
  exportVapidKeys,
  generateVapidKeys,
} from "../vapid.ts";

const keys = await generateVapidKeys({ extractable: true });

const vapidJwks = await exportVapidKeys(keys);
console.log(
  JSON.stringify(vapidJwks, undefined, 2),
);
console.error(
  `your application server key is: ${await exportApplicationServerKey(keys)}`,
);
