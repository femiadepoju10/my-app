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
import { AlertTriangle, Eye } from "lucide-react";

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
    <div className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Dispute Management
      </h1>

      {disputes.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="inbox"
            title="No disputes found"
            description="All transactions are running smoothly. Disputes will appear here when buyers report issues."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} padding="none" className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Dispute #{dispute.id}
                      </h3>
                      <Badge variant="warning" size="sm">
                        {dispute.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">
                      Opened by: <span className="font-medium text-zinc-700 dark:text-zinc-300">{dispute.openedBy.name}</span> ({dispute.openedBy.email})
                    </p>
                    <p className="text-sm text-zinc-500">
                      Transaction: <Link href={`/transaction/${dispute.transaction.id}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">#{dispute.transaction.id}</Link>
                    </p>
                    {dispute.transaction.product && (
                      <p className="text-sm text-zinc-500">
                        Product: <span className="font-medium text-zinc-700 dark:text-zinc-300">{dispute.transaction.product.title}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{formatPrice(dispute.transaction.totalAmount)}</p>
                    <p className="text-xs text-zinc-500">Total amount</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reason</p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{dispute.reason}</p>
                  </div>
                  {dispute.evidence && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Evidence</p>
                      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{dispute.evidence}</p>
                    </div>
                  )}
                </div>

                {dispute.resolution && (
                  <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Resolution</p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{dispute.resolution}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link href={`/transaction/${dispute.transaction.id}`}>
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
