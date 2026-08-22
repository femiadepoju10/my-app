"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Transaction {
  id: string;
  itemPrice: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  buyerName: string;
  productName: string;
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

const STATUS_OPTIONS = [
  "", "payment_pending", "payment_confirmed", "seller_contacted", "item_delivered",
  "inspection_pending", "accepted", "rejected", "disputed",
  "payout_pending", "payout_completed", "completed",
  "refund_pending", "refund_completed",
];

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.totalPages || 1);
      }
      setLoading(false);
    }
    fetchTransactions();
  }, [status, page]);

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.productName.toLowerCase().includes(search.toLowerCase()) ||
      tx.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      String(tx.id).includes(search)
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="search"
            title="No transactions found"
            description="Try adjusting your filters or search terms."
          />
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">ID</th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Product</th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Buyer</th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Amount</th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/transaction/${tx.id}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        #{tx.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">{tx.productName}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{tx.buyerName}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{formatPrice(tx.totalAmount, "NGN")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariantMap[tx.status] || "default"} size="sm">
                        {tx.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
