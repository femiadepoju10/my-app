self.addEventListener("push", (event) => {
  let data;
  try {
    data = event.data?.json();
  } catch {
    data = {};
  }

  const title = data.title || "PassitOn Notification";
  const body = data.body || "You have a new notification.";
  const url = data.data?.url || "/";

  const options = {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.data?.tag || "passiton-notification",
    data: { url },
    requireInteraction: data.data?.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data?.url || "/";

        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  // Optional: track notification dismissal for analytics
});
