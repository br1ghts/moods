self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    const defaultPayload = {
        title: 'Mood check-in',
        body: "Log how you're feeling — it'll take 10 seconds.",
        data: { url: '/log' },
    };

    let payload = defaultPayload;

    if (event.data) {
        try {
            payload = event.data.json();
        } catch (error) {
            payload = defaultPayload;
        }
    }

    const tag = payload.data?.bucket_key || 'mood-reminder';
    const options = {
        body: payload.body,
        data: payload.data,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag,
        renotify: false,
    };

    event.waitUntil(
        self.registration.getNotifications({ tag }).then((existing) => {
            if (existing && existing.length > 0) {
                return;
            }

            return self.registration.showNotification(payload.title, options);
        }),
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }

            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }

            return null;
        }),
    );
});
