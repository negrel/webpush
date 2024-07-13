// Listen for push messages and show a notification.
self.addEventListener("push", (e) => {
  const data = e.data.json();
  // See https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
  self.registration.showNotification(data.title, data);
});

