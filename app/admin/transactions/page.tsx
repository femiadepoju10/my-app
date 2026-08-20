"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface Transaction {
  id: number;
  itemPrice: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  buyerName: string;
  productName: string;
}

const statusColor: Record<string, string> = {
  payment_pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  payment_confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  seller_contacted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  item_delivered: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  inspection_pending: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  disputed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  payout_pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  payout_completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  refund_pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  refund_completed: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">No transactions found.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-3">
                      <Link href={`/transaction/${tx.id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
                        #{tx.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">{tx.productName}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{tx.buyerName}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(tx.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[tx.status] || ""}`}>
                        {tx.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
