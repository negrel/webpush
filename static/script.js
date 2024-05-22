const { publicVapidKey } = await fetch("/vapid.json").then((r) => r.json());

// Check for service worker
if ("serviceWorker" in navigator) {
  send().catch((err) => console.error(err));
}

// Register SW, Register Push, Send Push
async function send() {
  // Register Service Worker
  console.log("Registering service worker...");
  const register = await navigator.serviceWorker.register(
    "./service-worker.js",
    {
      scope: "/",
    },
  );
  console.log("Service Worker Registered...");
  const onServiceWorkerActive = async () => {
    // Register Push
    console.log("Registering Push...", register);
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
    console.log("Push Registered...", JSON.stringify(subscription));

    // Send Push Notification
    console.log("Sending Push...");
    await fetch("/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "content-type": "application/json",
      },
    });
    console.log("Push Sent...");
  };

  for (const k of ["installing", "waiting", "active"]) {
    if (register[k]) {
      register[k].onerror = console.error;
      if (register[k].state === "activated") {
        await onServiceWorkerActive();
      } else {
        register[k].onstatechange = (ev) => {
          if (ev.target.state === "activated") {
            onServiceWorkerActive();
          }
        };
      }
    }
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
