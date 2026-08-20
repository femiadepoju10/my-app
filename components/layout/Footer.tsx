import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            &copy; {new Date().getFullYear()} Skillbridge. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/products" className="hover:text-zinc-900 dark:hover:text-zinc-50">
              Browse
            </Link>
            <Link href="/products/sell" className="hover:text-zinc-900 dark:hover:text-zinc-50">
              Sell
            </Link>
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-50">
              Log in
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
