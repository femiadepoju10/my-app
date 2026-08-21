"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="w-full max-w-md text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Invalid link</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">This password reset link is invalid.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          Request a new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setMessage("Password reset successful! You can now log in.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Set new password</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Enter your new password below.</p>
      </div>

      {message ? (
        <Card padding="lg" className="text-center">
          <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            {message}
          </div>
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            Go to login
          </Link>
        </Card>
      ) : (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
            )}

            <Input
              label="New password"
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              icon={<Lock className="h-4 w-4" />}
            />

            <Input
              label="Confirm password"
              type="password"
              id="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              icon={<Lock className="h-4 w-4" />}
            />

            <Button type="submit" isLoading={loading} className="w-full">
              {loading ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p className="text-zinc-500">Loading...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
