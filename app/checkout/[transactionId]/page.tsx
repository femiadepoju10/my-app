"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, Shield, Clock, CheckCircle, CreditCard, Loader2, Lock, RefreshCw, Mail } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";

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

const CHECKOUT_STEPS = [
  { key: "cart", label: "Cart", icon: ShoppingBag },
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "delivery", label: "Delivery", icon: Clock },
  { key: "complete", label: "Complete", icon: CheckCircle },
];

function getCheckoutStep(status: string): number {
  if (status === "payment_pending") return 1;
  if (["payment_confirmed", "seller_contacted", "item_delivered", "inspection_pending"].includes(status)) return 2;
  if (["accepted", "payout_pending", "payout_completed", "completed"].includes(status)) return 3;
  if (["rejected", "disputed", "refund_pending", "refund_completed"].includes(status)) return 2;
  return 0;
}

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const reference = searchParams.get("reference");

  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function fetchTransaction() {
      if (status === "loading") return;
      if (!session?.user) {
        router.push(`/login?callbackUrl=/checkout/${params.transactionId}`);
        return;
      }

      const res = await fetch(`/api/transactions/${params.transactionId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      const tx = data.transaction;

      if (tx && tx.buyerId !== parseInt(session.user.id)) {
        router.push("/products");
        return;
      }

      setTransaction(tx);
      setLoading(false);
    }
    fetchTransaction();
  }, [params.transactionId, session, status, router]);

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
        addToast(data.error || "Failed to initialize payment", "error");
        setPaying(false);
        return;
      }

      window.location.href = data.authorization_url;
    } catch {
      addToast("Something went wrong", "error");
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

  const currentStep = getCheckoutStep(transaction.status);

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
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push(`/transaction/${transaction.id}`)}
        >
          <RefreshCw className="h-4 w-4" />
          View Transaction Status
        </Button>
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
        <Button
          href={`/transaction/${transaction.id}`}
          className="mt-6"
        >
          <ShoppingBag className="h-4 w-4" />
          View Transaction
        </Button>
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

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {CHECKOUT_STEPS.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i <= currentStep
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              }`}>
                <step.icon className="h-4 w-4" />
              </div>
              <span className={`mt-1 text-xs font-medium ${
                i <= currentStep ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"
              }`}>
                {step.label}
              </span>
            </div>
            {i < CHECKOUT_STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 transition-colors ${
                i < currentStep ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Product Card */}
      <Card padding="none" className="mb-6 overflow-hidden">
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
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                Total
              </span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {formatPrice(transaction.totalAmount)}
              </span>
            </div>
          </div>

          <Button
            onClick={handlePaystackPayment}
            isLoading={paying}
            className="mt-6 w-full"
            size="lg"
          >
            <CreditCard className="h-4 w-4" />
            {paying ? "Redirecting to Paystack..." : "Pay with Paystack"}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              SSL Secured
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Buyer Protection
            </div>
            <div className="flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Money-back Guarantee
            </div>
          </div>
        </div>
      </Card>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          <Shield className="h-3.5 w-3.5" />
          Escrow Protected
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
          <Lock className="h-3.5 w-3.5" />
          Secure Payment
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
          <Mail className="h-3.5 w-3.5" />
          Email Receipt
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
