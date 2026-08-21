"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setMessage(data.message || "If an account exists, a verification email has been sent.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Resend verification email</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your email and we&apos;ll send you a new verification link.
        </p>
      </div>

      {message && !error ? (
        <Card padding="lg" className="text-center">
          <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            {message}
          </div>
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            Back to login
          </Link>
        </Card>
      ) : (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
            )}

            <Input
              label="Email"
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
            />

            <Button type="submit" isLoading={loading} className="w-full">
              {loading ? "Sending..." : "Resend verification email"}
            </Button>
          </form>
        </Card>
      )}

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already verified?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Log in</Link>
      </p>
    </div>
  );
}
