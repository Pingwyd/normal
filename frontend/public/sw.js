self.addEventListener("push", (event) => {
  let title = "Is it normal?";
  let body = "You have a new update.";
  let targetUrl = "/";

  if (event.data) {
    try {
      const payload = event.data.json();
      if (typeof payload.title === "string" && payload.title.trim()) {
        title = payload.title.trim();
      }
      if (typeof payload.body === "string" && payload.body.trim()) {
        body = payload.body.trim();
      }
      if (typeof payload.url === "string" && payload.url.trim()) {
        targetUrl = payload.url.trim();
      }
    } catch {
      const text = event.data.text();
      if (text) {
        body = text;
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
      data: { url: targetUrl },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }

        return undefined;
      }),
  );
});
