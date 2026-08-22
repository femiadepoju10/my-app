import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import EmptyState from "@/components/ui/EmptyState";
import { Eye } from "lucide-react";

export default async function AdminRefundsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const refunds = await db.refunds.findMany({
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
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Refund Management
      </h1>

      {refunds.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="inbox"
            title="No refunds found"
            description="Refund requests will appear here when buyers reject items and refunds are initiated."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <Card key={refund.id} padding="none" className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Refund #{refund.id}
                      </h3>
                      <Badge variant={refund.status === "completed" ? "success" : "warning"} size="sm">
                        {refund.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">
                      Transaction: <Link href={`/transaction/${refund.transaction.id}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">#{refund.transaction.id}</Link>
                    </p>
                    {refund.transaction.product && (
                      <p className="text-sm text-zinc-500">
                        Product: <span className="font-medium text-zinc-700 dark:text-zinc-300">{refund.transaction.product.title}</span>
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Refund Amount</p>
                    <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {formatPrice(refund.amount, "NGN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Transaction Total</p>
                    <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {formatPrice(refund.transaction.totalAmount, "NGN")}
                    </p>
                  </div>
                </div>

                {refund.reason && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reason</p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{refund.reason}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link href={`/transaction/${refund.transaction.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                      View Transaction
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
