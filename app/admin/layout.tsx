import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import NavTabs from "@/components/layout/NavTabs";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Shield } from "lucide-react";

const ADMIN_TABS = [
  { href: "/admin", label: "Overview", icon: "dashboard" as const },
  { href: "/admin/transactions", label: "Transactions", icon: "purchases" as const },
  { href: "/admin/disputes", label: "Disputes", icon: "notifications" as const },
  { href: "/admin/refunds", label: "Refunds", icon: "sales" as const },
  { href: "/admin/users", label: "Users", icon: "profile" as const },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await db.users.findFirst({
    where: { id: parseInt(session.user.id) },
    select: { role: true, name: true },
  });

  if (!user || user.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Admin Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Welcome back, {user.name}
            </p>
          </div>
        </div>
        <Badge variant="primary" size="sm">
          Admin Access
        </Badge>
      </div>

      <div className="flex gap-8">
        <NavTabs tabs={ADMIN_TABS} />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
      </div>
    </div>
  );
}
