"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, Loader2 } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markAsRead(id: number) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch {
      // silent fail
    }
  }

  async function markAllAsRead() {
    try {
      await Promise.all(
        notifications.filter((n) => !n.readAt).map((n) =>
          fetch(`/api/notifications/${n.id}`, { method: "PATCH" })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {
      // silent fail
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            <Check className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">
          <Bell className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <p>No notifications yet</p>
          <p className="mt-1 text-sm">We&apos;ll notify you when something happens.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-4 transition-colors ${
                notification.readAt
                  ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  : "border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-900/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.readAt && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
