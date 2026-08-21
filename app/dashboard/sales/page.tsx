"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatCondition } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { TrendingUp, Loader2 } from "lucide-react";

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

const statusVariantMap: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  payment_pending: "warning",
  payment_confirmed: "primary",
  seller_contacted: "primary",
  item_delivered: "primary",
  inspection_pending: "warning",
  accepted: "success",
  rejected: "danger",
  disputed: "danger",
  payout_pending: "warning",
  payout_completed: "success",
  completed: "success",
  refund_pending: "warning",
  refund_completed: "success",
};

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
    <div className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        My Sales
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="cart"
          title="No sales yet"
          description="You haven't made any sales yet. List your first item to get started."
          action={
            <Button href="/products/sell">
              <TrendingUp className="h-4 w-4" />
              List an Item
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <Link
              key={tx.id}
              href={`/transaction/${tx.id}`}
              className="block"
            >
              <Card hover padding="none" className="overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
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
                    <Badge variant={statusVariantMap[tx.status] || "default"} size="sm" className="mt-1">
                      {statusLabel[tx.status] ?? tx.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
