"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavTab {
  href: string;
  label: string;
}

export default function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => {
        const isActive = tab.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
