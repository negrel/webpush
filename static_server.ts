import {
  contentType,
  decodeBase64Url,
  encodeBase64Url,
  extname,
} from "./deps.ts";
import { PushSubscription } from "./mod.ts";
import { pushMessage } from "./push.ts";
import { importVapidKeys } from "./vapid.ts";
import vapidJson from "./vapid.json" with { type: "json" };

console.log = (...args) =>
  Deno.stdout.write(new TextEncoder().encode(JSON.stringify([...args]) + "\n"));

const eceKeys = await crypto.subtle.generateKey(
  {
    name: "ECDH",
    namedCurve: "P-256",
  },
  false,
  ["deriveKey"],
);

const vapidKeysObj = {
  publicKey: decodeBase64Url(vapidJson.publicKey).buffer.slice(0),
  privateKey: decodeBase64Url(vapidJson.privateKey).buffer.slice(0),
};
const vapidKeys = await importVapidKeys(crypto.subtle, vapidKeysObj);

// Start listening on port 3000 of localhost.
const server = Deno.listen({ port: 3000 });
console.log("File server running on http://localhost:3000/");

for await (const conn of server) {
  handleHttp(conn).catch(console.error);
}

async function handleHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const url = new URL(requestEvent.request.url);

    if (requestEvent.request.method === "GET") {
      let filepath = decodeURIComponent(url.pathname);
      if (filepath === "/" || filepath === "") filepath = "/index.html";

      // Try opening the file
      let file;
      try {
        file = await Deno.open("./static" + filepath, { read: true });
      } catch {
        requestEvent.respondWith(
          new Response(
            JSON.stringify({
              publicVapidKey: encodeBase64Url(
                await crypto.subtle.exportKey("raw", vapidKeys.publicKey),
              ),
            }),
          ),
        );
        // // If the file cannot be opened, return a "404 Not Found" response
        // const notFoundResponse = new Response("404 Not Found", { status: 404 });
        // await requestEvent.respondWith(notFoundResponse);
        continue;
      }

      // Build a readable stream so the file doesn't have to be fully loaded into
      // memory while we send it
      const readableStream = file.readable;

      // Build and send the response
      const response = new Response(readableStream, {
        headers: {
          "Content-Type": contentType(extname(filepath) ?? "") ??
            "text/plain",
        },
      });
      await requestEvent.respondWith(response);
    } else if (requestEvent.request.method === "POST") {
      switch (url.pathname) {
        case "/subscribe": {
          const body: PushSubscription = await requestEvent.request.json();
          console.log("subscribing", body);
          const resp = await pushMessage(
            crypto.subtle,
            eceKeys,
            vapidKeys,
            body,
            new TextEncoder().encode("HELLO"),
          );
          console.log(resp);
          console.log(await resp.text());
          requestEvent.respondWith(new Response(null));

          break;
        }
        default:
          console.error("not found", url.pathname);
          requestEvent.respondWith(new Response(null, { status: 404 }));
      }
    }
  }
}
