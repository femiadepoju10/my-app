"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LogoutButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  iconClassName?: string;
  mobile?: boolean;
}

export default function LogoutButton({
  variant = "primary",
  size = "md",
  label = "Sign out",
  className = "",
  iconClassName = "h-4 w-4",
  mobile = false,
}: LogoutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error("Logout error:", err);
      setLoading(false);
    }
  }

  const handleCancel = () => setShowConfirm(false);

  // Desktop: render button + overlay modal
  if (!mobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className={className}
        >
          <LogOut className={iconClassName} />
          {label}
        </button>

        {showConfirm && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={handleCancel}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 animate-scale-in"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Confirm Sign Out
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  You are about to sign out of your account. You will be returned to the homepage.
                  Are you sure you want to continue?
                </p>

                <div className="mt-6 flex gap-3">
                    <Button
                    variant="outline"
                    size="md"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Stay on PassitOn
                  </Button>
                  <Button
                    variant="destructive"
                    size="md"
                    onClick={handleConfirm}
                    isLoading={loading}
                    className="flex-1"
                  >
                    {loading ? "Signing out..." : "Sign Out"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // Mobile: render inline confirmation within the menu
  if (showConfirm) {
    return (
      <>
        <button
          type="button"
          onClick={handleCancel}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4" />
          {loading ? "Signing out..." : label}
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      className={className}
    >
      <LogOut className={iconClassName} />
      {label}
    </button>
  );
}
