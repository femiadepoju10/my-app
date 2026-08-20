import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

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

      <div className="mb-8 flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="border-b-2 border-transparent pb-3 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Overview
        </Link>
        <Link
          href="/dashboard/listings"
          className="border-b-2 border-transparent pb-3 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          My Listings
        </Link>
        <Link
          href="/dashboard/purchases"
          className="border-b-2 border-transparent pb-3 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          My Purchases
        </Link>
        <Link
          href="/dashboard/sales"
          className="border-b-2 border-transparent pb-3 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          My Sales
        </Link>
      </div>

      {children}
    </div>
  );
}
