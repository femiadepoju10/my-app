import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NavTabs from "@/components/layout/NavTabs";

const DASHBOARD_TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/listings", label: "My Listings" },
  { href: "/dashboard/purchases", label: "My Purchases" },
  { href: "/dashboard/sales", label: "My Sales" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Welcome back, {session.user.name}
        </p>
      </div>

      <NavTabs tabs={DASHBOARD_TABS} />

      {children}
    </div>
  );
}
