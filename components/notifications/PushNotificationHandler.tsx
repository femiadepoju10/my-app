"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";

export default function PushNotificationHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;

    async function registerAndCheck() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        const permission = await Notification.requestPermission();
        if (permission !== "granted" || cancelled) return;

        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          return;
        }
      } catch {
        // silent fail
      }
    }

    registerAndCheck();

    return () => {
      cancelled = true;
    };
  }, [session, status]);

  return null;
}
