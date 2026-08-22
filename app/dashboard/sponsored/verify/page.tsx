"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SponsoredVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setMessage("Missing payment reference");
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/sponsored-listings/verify?reference=${reference}`);
        const data = await res.json();

        if (res.ok && data.listing) {
          setStatus("success");
          setMessage("Your sponsored listing is now active!");
          addToast("Sponsored listing activated!", "success");
        } else {
          setStatus("failed");
          setMessage(data.error || data.message || "Payment verification failed");
        }
      } catch {
        setStatus("failed");
        setMessage("Failed to verify payment");
      }
    }

    verifyPayment();
  }, [reference, addToast]);

  return (
    <div className="mx-auto max-w-md py-12 animate-fade-in">
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Verifying Payment
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Please wait while we confirm your sponsored listing payment.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Payment Successful
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
              <Button
                variant="primary"
                className="mt-2 w-full"
                onClick={() => router.push("/dashboard/sponsored")}
              >
                View My Sponsorships
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Payment Not Completed
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Go Back
                </Button>
                {reference && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={async () => {
                      const res = await fetch("/api/sponsored-listings/verify?reference=" + reference);
                      const data = await res.json();
                      if (res.ok && data.listing) {
                        addToast("Payment confirmed!", "success");
                        router.push("/dashboard/sponsored");
                      } else {
                        addToast(data.error || "Still pending payment", "error");
                      }
                    }}
                  >
                    Retry Verification
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
