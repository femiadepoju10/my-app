import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import NavTabs from "@/components/layout/NavTabs";

const ADMIN_TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/users", label: "Users" },
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
    select: { role: true },
  });

  if (!user || user.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage users, transactions, and payouts
        </p>
      </div>

      <NavTabs tabs={ADMIN_TABS} />

      {children}
    </div>
  );
}
