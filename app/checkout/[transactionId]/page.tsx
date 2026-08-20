"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Shield, Clock, CheckCircle, CreditCard, Loader2 } from "lucide-react";

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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
      <div className="mx-auto max-w-md py-20 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
          <Clock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
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
      <div className="mx-auto max-w-md py-20 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Payment Confirmed
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Your payment has been processed successfully.
        </p>
        <a
          href={`/transaction/${transaction.id}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700"
        >
          <ShoppingBag className="h-4 w-4" />
          View Transaction
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-12 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Checkout
        </h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {transaction.product?.title ?? "Product"}
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Item price</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {formatPrice(transaction.itemPrice)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Service fee (10%)</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {formatPrice(transaction.serviceFee)}
              </span>
            </div>
            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <div className="flex justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Total
                </span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {formatPrice(transaction.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePaystackPayment}
            disabled={paying}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:shadow-xl disabled:opacity-50"
          >
            {paying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {paying ? "Redirecting to Paystack..." : "Pay with Paystack"}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <Shield className="h-3.5 w-3.5" />
            Secure payment powered by Paystack
          </div>
        </div>
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
