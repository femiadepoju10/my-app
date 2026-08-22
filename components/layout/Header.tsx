import Link from "next/link";
import { getServerSession } from "next-auth";
import { Handshake, ShoppingCart, Tag, LayoutDashboard, Shield, Trophy } from "lucide-react";
import MobileMenu from "./MobileMenu";
import NotificationBell from "./NotificationBell";
import LogoutButton from "./LogoutButton";
import BrandName from "@/components/ui/BrandName";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export default async function Header() {
  const session = await getServerSession(authOptions);
  const loyalty = session?.user
    ? await db.users.findUnique({
        where: { id: session.user.id },
        select: { loyaltyPointBalance: true, loyaltyTier: true },
      }).catch(() => null)
    : null;

  const navLinks = [
    { href: "/products", label: "Browse", icon: ShoppingCart },
    { href: "/products/sell", label: "Sell", icon: Tag },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Handshake className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            <BrandName />
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <NotificationBell />
              {session?.user && loyalty && (loyalty.loyaltyPointBalance || 0) > 0 && (
                <Link
                  href="/dashboard/loyalty"
                  className="hidden items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30 sm:flex"
                >
                  <Trophy className="h-4 w-4" />
                  {loyalty.loyaltyPointBalance} pts
                </Link>
              )}
              {session?.user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 sm:flex"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <LogoutButton
                variant="primary"
                label="Sign out"
                className="hidden items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:flex"
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:block"
              >
                Sign up
              </Link>
            </>
          )}

          <MobileMenu session={session as unknown as { user?: { id?: string; name?: string | null; role?: string } | null } | null} />
        </div>
      </div>
    </header>
  );
}
