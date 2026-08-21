"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatCondition } from "@/lib/utils";

interface Transaction {
  id: number;
  itemPrice: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  productId: number;
  product?: {
    id: number;
    title: string;
    condition: string;
    images: { imageUrl: string }[];
  };
}

export default function SalesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSales() {
      const res = await fetch("/api/transactions?role=seller");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
      setLoading(false);
    }
    fetchSales();
  }, []);

  const statusColor: Record<string, string> = {
    payment_pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    payment_confirmed:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    accepted:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusLabel: Record<string, string> = {
    payment_pending: "Payment Pending",
    payment_confirmed: "Payment Confirmed",
    seller_contacted: "Seller Contacted",
    item_delivered: "Item Delivered",
    inspection_pending: "Awaiting Inspection",
    accepted: "Accepted",
    rejected: "Rejected",
    disputed: "Disputed",
    payout_pending: "Payout Pending",
    payout_completed: "Payout Completed",
    completed: "Completed",
    refund_pending: "Refund Pending",
    refund_completed: "Refunded",
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        My Sales
      </h1>

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">
          <p>You haven&apos;t made any sales yet.</p>
          <Link
            href="/products/sell"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
          >
            List your first item
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <Link
              key={tx.id}
              href={`/transaction/${tx.id}`}
              className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
                {tx.product?.images?.[0] ? (
                  <Image
                    src={tx.product.images[0].imageUrl}
                    alt={tx.product.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                    No img
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {tx.product?.title || `Transaction #${tx.id}`}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
                {tx.product?.condition && (
                  <p className="text-xs text-zinc-400">
                    {formatCondition(tx.product.condition)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {formatPrice(tx.itemPrice)}
                </p>
                <span
                  className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[tx.status] ?? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}
                >
                  {statusLabel[tx.status] ?? tx.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
