// MeetNote service worker — handles incoming web-push notifications and
// brings the user back to a relevant page when they click the notification.

self.addEventListener("install", (event) => {
  // Activate immediately on first install.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "MeetNote", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "MeetNote";
  const body = data.body || "";
  const tag = data.id || data.type || "meetnote";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/vite.svg",
      badge: "/vite.svg",
      tag,
      data,
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};

  let path = "/home";
  if (data.type) {
    if (
      data.type === "transcript-ready" ||
      data.type === "transcript-failed" ||
      data.type === "notes-ready" ||
      data.type === "notes-failed"
    ) {
      path = "/history";
    } else if (data.type === "join-request-missed" && data.roomId) {
      path = `/room/${data.roomId}?host=1`;
    } else if (data.type && data.type.indexOf("meeting-") === 0) {
      path = "/schedules";
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(path);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(path);
      }
    })
  );
});
