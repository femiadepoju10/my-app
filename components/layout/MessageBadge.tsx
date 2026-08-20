"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MessageBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        const total = (data.conversations || []).reduce(
          (sum: number, c: { unreadCount: number }) => sum + c.unreadCount,
          0
        );
        setCount(total);
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/dashboard/messages"
      className="relative rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      Messages
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
