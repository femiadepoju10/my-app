import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-100 dark:bg-zinc-800">
        <SearchX className="h-10 w-10 text-zinc-400" />
      </div>
      <h1 className="mt-6 text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        404
      </h1>
      <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
        This page could not be found.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Go home
        </Link>
        <Link
          href="/products"
          className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Browse marketplace
        </Link>
      </div>
    </div>
  );
}
