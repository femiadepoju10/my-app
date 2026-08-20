"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token ? "" : "No verification token found."
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (!cancelled) {
          if (res.ok) {
            setStatus("success");
            setMessage("Email verified successfully! You can now log in.");
          } else {
            setStatus("error");
            setMessage(data.error || "Verification failed.");
          }
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Something went wrong.");
        }
      }
    }
    verify();

    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="w-full max-w-md text-center">
      {status === "loading" && (
        <p className="text-zinc-500">Verifying your email...</p>
      )}
      {status === "success" && (
        <>
          <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            {message}
          </div>
          <Link href="/login" className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            Go to login
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {message}
          </div>
          <Link href="/signup" className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            Sign up again
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p className="text-zinc-500">Loading...</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
