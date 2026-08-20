"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Something went wrong</h2>
      <p className="mt-2 text-sm text-zinc-500">{error.message || "An unexpected error occurred."}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Try again
      </button>
    </div>
  );
}
