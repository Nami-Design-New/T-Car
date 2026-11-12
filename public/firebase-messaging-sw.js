/* Firebase's background-push handler. This public file cannot use Next imports. */
self.addEventListener("notificationclick", (event) => {
  // Register before Firebase Messaging so its default click handler cannot
  // replace T-Car's action-aware route handling.
  event.stopImmediatePropagation();
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      if (windows[0]) {
        windows[0].postMessage({ type: "notification-tap", ...data });
        return windows[0].focus();
      }
      const params = new URLSearchParams({
        notification_action: data.action || "",
      });
      if (data.order_id) params.set("notification_order_id", data.order_id);
      return self.clients.openWindow(`/account/notifications?${params}`);
    })(),
  );
});

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAaffu70zMb7Yh-jhVwZUNNcCBBCx7VaFg",
  authDomain: "tcar-9ab64.firebaseapp.com",
  projectId: "tcar-9ab64",
  storageBucket: "tcar-9ab64.firebasestorage.app",
  messagingSenderId: "739821046146",
  appId: "1:739821046146:web:48954f4c701c9e669de79b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(
    payload.notification?.title || data.title || "T-Car",
    {
      body: payload.notification?.body || data.message || "",
      icon: "/images/placeholders/company-logo-fallback.svg",
      data: { action: data.action || null, order_id: data.order_id || null },
    },
  );
});
