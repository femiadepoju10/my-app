"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface TransactionData {
  id: number;
  buyerId: number;
  sellerId: number;
  itemPrice: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  product: {
    id: number;
    title: string;
    images: { imageUrl: string }[];
  } | null;
}

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function fetchTransaction() {
      const res = await fetch(`/api/transactions/${params.transactionId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTransaction(data.transaction);
      setLoading(false);
    }
    fetchTransaction();
  }, [params.transactionId]);

  useEffect(() => {
    if (!reference || !transaction) return;
    if (transaction.status !== "payment_pending") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/transactions/${params.transactionId}`);
      if (res.ok) {
        const data = await res.json();
        setTransaction(data.transaction);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [reference, transaction, params.transactionId]);

  async function handlePaystackPayment() {
    if (!transaction) return;
    setPaying(true);

    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok || !data.authorization_url) {
        alert(data.error || "Failed to initialize payment");
        setPaying(false);
        return;
      }

      window.location.href = data.authorization_url;
    } catch {
      alert("Something went wrong");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Transaction not found</p>
      </div>
    );
  }

  if (reference && transaction.status === "payment_pending") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mb-6 text-6xl">⏳</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Processing Payment
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Please wait while we verify your payment...
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Reference: {reference}
        </p>
      </div>
    );
  }

  if (transaction.status !== "payment_pending") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mb-6 text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Payment Confirmed
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Your payment has been processed successfully.
        </p>
        <a
          href={`/transaction/${transaction.id}`}
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          View Transaction
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-12">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Checkout
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {transaction.product?.title ?? "Product"}
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Item price
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(transaction.itemPrice)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Service fee (10%)
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(transaction.serviceFee)}
            </span>
          </div>
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="flex justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                Total
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(transaction.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePaystackPayment}
          disabled={paying}
          className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {paying ? "Redirecting to Paystack..." : "Pay with Paystack"}
        </button>

        <p className="mt-4 text-center text-xs text-zinc-500">
          You will be redirected to Paystack to complete your payment
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p className="text-zinc-500">Loading...</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
