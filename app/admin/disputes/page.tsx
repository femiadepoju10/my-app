import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default async function AdminDisputesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const disputes = await db.disputes.findMany({
    include: {
      transaction: {
        select: {
          id: true,
          productId: true,
          itemPrice: true,
          totalAmount: true,
          status: true,
          product: {
            select: { title: true, images: { where: { sortOrder: 0 }, take: 1 } },
          },
        },
      },
      openedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Dispute Management
      </h1>

      <div className="space-y-4">
        {disputes.map((dispute) => (
          <div
            key={dispute.id}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Dispute #{dispute.id}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Opened by: {dispute.openedBy.name} ({dispute.openedBy.email})
                </p>
                <p className="text-sm text-zinc-500">
                  Transaction: #{dispute.transaction.id}
                </p>
                {dispute.transaction.product && (
                  <p className="text-sm text-zinc-500">
                    Product: {dispute.transaction.product.title}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {dispute.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reason:</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{dispute.reason}</p>
            </div>

            {dispute.evidence && (
              <div className="mt-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Evidence:</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{dispute.evidence}</p>
              </div>
            )}

            {dispute.resolution && (
              <div className="mt-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Resolution:</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{dispute.resolution}</p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Link
                href={`/transaction/${dispute.transaction.id}`}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                View Transaction
              </Link>
            </div>
          </div>
        ))}

        {disputes.length === 0 && (
          <div className="py-20 text-center text-zinc-500">
            No disputes found
          </div>
        )}
      </div>
    </div>
  );
}
