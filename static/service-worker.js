console.log("Service Worker Loaded...");

self.addEventListener("push", (e) => {
  const data = e.data.text();
  console.log("Push Recieved...", data);
  self.registration.showNotification(data, {
    body: "Knock Knock",
  });
});
