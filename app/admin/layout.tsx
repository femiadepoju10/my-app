import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import NavTabs from "@/components/layout/NavTabs";

const ADMIN_TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, parseInt(session.user.id)))
    .get();

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
