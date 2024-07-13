// import * as webpush from "jsr:@negrel/webpush";
import * as webpush from "../mod.ts";

// Used by HTTP server.
import { encodeBase64Url } from "jsr:@std/encoding@0.224.0/base64url";

// Put your email here so Push Service admin from Firefox / Google can contact
// you if there is a problem with your application server.
const adminEmail = "john@example.com";

// Read vapid.json file and import keys.
const exportedVapidKeys = JSON.parse(await Deno.readTextFile("./vapid.json"));
const vapidKeys = await webpush.importVapidKeys(exportedVapidKeys, {
  extractable: false,
});

// Create an application server object.
const appServer = await webpush.ApplicationServer.new({
  contactInformation: "mailto:" + adminEmail,
  vapidKeys,
});

// Start an http server.
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  switch (url.pathname) {
    case "/": // HTML page.
      return new Response(await Deno.readTextFile("./index.html"), {
        headers: { "Content-Type": "text/html" },
      });

    case "/sw.js": // Service Worker.
      return new Response(await Deno.readTextFile("./sw.js"), {
        headers: { "Content-Type": "application/javascript" },
      });

    case "/api/vapid": {
      // We send public key only!
      const publicKey = encodeBase64Url(
        await crypto.subtle.exportKey(
          "raw",
          vapidKeys.publicKey,
        ),
      );

      return new Response(JSON.stringify(publicKey), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    case "/api/subscribe": {
      // Retrieve subscription.
      const subscription = await req.json();
      // You can store it in a DB to reuse it later.
      // ...

      // Create a subscriber object.
      const subscriber = appServer.subscribe(subscription);

      // Send notification.
      await subscriber.pushTextMessage(
        JSON.stringify({ title: "Hello from application server!" }),
        {},
      );

      // OK.
      return new Response();
    }

    default:
      return new Response(null, { status: 404 });
  }
});
