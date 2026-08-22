import { LucideIcon, Package, ShoppingCart, Bell, Inbox, Search, Heart, Trophy, Rocket } from "lucide-react";
import { Button } from "./Button";

type EmptyStateIcon = "package" | "cart" | "bell" | "inbox" | "search" | "heart" | "trophy" | "rocket";

const iconMap: Record<EmptyStateIcon, LucideIcon> = {
  package: Package,
  cart: ShoppingCart,
  bell: Bell,
  inbox: Inbox,
  search: Search,
  heart: Heart,
  trophy: Trophy,
  rocket: Rocket,
};

interface EmptyStateProps {
  icon: EmptyStateIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && <Icon className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />}
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
