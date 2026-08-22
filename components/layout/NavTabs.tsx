"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  User,
  Bell,
  Heart,
  BarChart3,
  Trophy,
  Shield,
  Rocket,
} from "lucide-react";

interface NavTab {
  href: string;
  label: string;
  icon?: "dashboard" | "listings" | "purchases" | "sales" | "wishlist" | "notifications" | "profile" | "analytics" | "loyalty" | "kyc" | "sponsored";
}

const iconMap = {
  dashboard: LayoutDashboard,
  listings: Package,
  purchases: ShoppingCart,
  sales: DollarSign,
  wishlist: Heart,
  notifications: Bell,
  profile: User,
  analytics: BarChart3,
  loyalty: Trophy,
  kyc: Shield,
  sponsored: Rocket,
};

export default function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24 space-y-1">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(tab.href);
            const Icon = tab.icon ? iconMap[tab.icon] : LayoutDashboard;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-900/20 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(tab.href);
            const Icon = tab.icon ? iconMap[tab.icon] : LayoutDashboard;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
