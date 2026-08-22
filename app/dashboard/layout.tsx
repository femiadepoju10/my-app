import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import NavTabs from "@/components/layout/NavTabs";

const DASHBOARD_TABS = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" as const },
  { href: "/dashboard/analytics", label: "Analytics", icon: "analytics" as const },
  { href: "/dashboard/listings", label: "My Listings", icon: "listings" as const },
  { href: "/dashboard/purchases", label: "My Purchases", icon: "purchases" as const },
  { href: "/dashboard/sales", label: "My Sales", icon: "sales" as const },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: "wishlist" as const },
  { href: "/dashboard/notifications", label: "Notifications", icon: "notifications" as const },
  { href: "/dashboard/profile", label: "Profile", icon: "profile" as const },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome back, {session.user.name}
        </p>
      </div>

      <div className="flex gap-8">
        <NavTabs tabs={DASHBOARD_TABS} />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
      </div>
    </div>
  );
}
