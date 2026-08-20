import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-zinc-900 dark:text-zinc-50">404</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        This page could not be found.
      </p>
      <Link
        href="/products"
        className="mt-8 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Browse Marketplace
      </Link>
    </div>
  );
}
