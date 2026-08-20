export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-900">
      {children}
    </div>
  );
}
