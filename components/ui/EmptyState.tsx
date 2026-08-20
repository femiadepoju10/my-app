import { PackageOpen, ShoppingCart, MessageSquare, SearchX, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: "package" | "cart" | "message" | "search" | "inbox";
  title: string;
  description: string;
  action?: React.ReactNode;
}

const icons = {
  package: PackageOpen,
  cart: ShoppingCart,
  message: MessageSquare,
  search: SearchX,
  inbox: Inbox,
};

export default function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
