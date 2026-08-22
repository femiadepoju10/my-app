"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface SubscriptionStatus {
  subscribed: boolean;
  permission: NotificationPermission;
  supported: boolean;
}

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    permission: "default",
    supported: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus((prev) => ({ ...prev, supported: false }));
      return;
    }

    setStatus((prev) => ({ ...prev, supported: true }));

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setStatus((prev) => ({ ...prev, subscribed: !!sub }));
      });
    });

    Notification.requestPermission().then((permission) => {
      setStatus((prev) => ({ ...prev, permission }));
    });
  }, []);

  async function enablePush() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const publicKeyRes = await fetch("/api/push/public-key");
      if (!publicKeyRes.ok) return;
      const { publicKey } = await publicKeyRes.json();

      const convertedKey = urlBase64ToUint8Array(publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as BufferSource,
      });

      await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      setStatus((prev) => ({ ...prev, subscribed: true, permission: "granted" }));
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  async function disablePush() {
    setLoading(true);
    try {
      await fetch("/api/push/subscriptions", { method: "DELETE" });

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }

      setStatus((prev) => ({ ...prev, subscribed: false }));
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!status.supported) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
      <div className="flex items-center gap-3">
        {status.subscribed ? (
          <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <BellOff className="h-5 w-5 text-zinc-400" />
        )}
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Push Notifications
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {status.subscribed
              ? "You will receive push notifications"
              : "Enable to receive real-time notifications"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status.subscribed && (
          <Badge variant="success" size="sm">
            On
          </Badge>
        )}
        {status.permission === "denied" && (
          <Badge variant="warning" size="sm">
            Blocked
          </Badge>
        )}
        {status.subscribed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={disablePush}
            isLoading={loading}
          >
            Disable
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={enablePush}
            isLoading={loading}
            disabled={status.permission === "denied"}
          >
            Enable
          </Button>
        )}
      </div>
    </div>
  );
}
