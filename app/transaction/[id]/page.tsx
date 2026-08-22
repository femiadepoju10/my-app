"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { formatPrice, formatCondition } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Package, Clock, CheckCircle, AlertTriangle,
  Truck, Search, ThumbsUp, ThumbsDown, CreditCard, Banknote,
  ShieldCheck, MessageSquare, Camera, X, Loader2, ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Avatar } from "@/components/ui/Avatar";
import ChatBox from "@/components/chat/ChatBox";

interface TransactionData {
  id: string;
  buyerId: string;
  sellerId: string;
  itemPrice: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason: string | null;
  rejectionPhotos: string | null;
  disputeNote: string | null;
  product: {
    id: string;
    title: string;
    description: string;
    condition: string;
    location: string;
    images: { imageUrl: string }[];
  } | null;
  buyer: { id: string; name: string; email: string; phone: string | null } | null;
  seller: { id: string; name: string; email: string; phone: string | null } | null;
  payment: { status: string; paidAt: string | null } | null;
  payout: { status: string; amount: number; paidAt: string | null } | null;
  refund: { status: string; amount: number; reason: string | null } | null;
   review: { id: string; rating: number; comment: string | null; createdAt: string } | null;
}

interface DeliveryTrackingData {
  id: string;
  transactionId: string;
  status: string;
  shippedAt: string | null;
  shippedNote: string | null;
  deliveredAt: string | null;
  deliveredNote: string | null;
  proofPhoto: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STEPS = [
  { key: "payment_pending", label: "Payment Pending" },
  { key: "payment_confirmed", label: "Payment Confirmed" },
  { key: "seller_contacted", label: "Seller Contacted" },
  { key: "item_delivered", label: "Item Delivered" },
  { key: "inspection_pending", label: "Inspection Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "payout_pending", label: "Payout Pending" },
  { key: "payout_completed", label: "Payout Completed" },
  { key: "completed", label: "Completed" },
];

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  if (idx !== -1) return idx;
  if (["rejected", "disputed", "refund_pending", "refund_completed"].includes(status)) {
    return STATUS_STEPS.findIndex((s) => s.key === "inspection_pending");
  }
  return -1;
}

const REJECTION_REASONS = [
  "Item not as described",
  "Item is damaged",
  "Wrong item received",
  "Missing parts or accessories",
  "Item is counterfeit",
  "Other",
];

function TransactionContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectPhotos, setRejectPhotos] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deliveryTracking, setDeliveryTracking] = useState<DeliveryTrackingData | null>(null);
  const [deliveringItem, setDeliveringItem] = useState(false);
  const [deliverProofPhoto, setDeliverProofPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/transactions/${params.id}`);
       if (!cancelled && res.ok) {
         const data = await res.json();
         setTransaction(data.transaction);

         const trackingRes = await fetch(`/api/delivery/${data.transaction.id}`);
         if (trackingRes.ok && !cancelled) {
           const trackingData = await trackingRes.json();
           setDeliveryTracking(trackingData.tracking || null);
         }
       } else if (!cancelled && res.status === 403) {
        router.push("/dashboard");
        return;
      } else if (!cancelled && res.status === 401) {
        router.push(`/login?callbackUrl=/transaction/${params.id}`);
        return;
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [params.id, router]);

  async function handleStatusChange(newStatus: string, extra?: Record<string, unknown>) {
    if (!transaction) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      if (res.ok) {
        const refresh = await fetch(`/api/transactions/${transaction.id}`);
        if (refresh.ok) {
          const refreshed = await refresh.json();
          setTransaction(refreshed.transaction);
        }
      } else {
        const data = await res.json();
        addToast(data.error || "Action failed", "error");
      }
     } catch {
      addToast("Something went wrong", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeliveryUpdate(status: string, note?: string, proofPhoto?: string) {
    if (!transaction) return;
    setDeliveringItem(true);
    try {
      const res = await fetch(`/api/delivery/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note, proofPhoto }),
      });
      if (res.ok) {
        const data = await res.json();
        setDeliveryTracking(data.tracking);
        if (data.transactionUpdated) {
          const refresh = await fetch(`/api/transactions/${transaction.id}`);
          if (refresh.ok) {
            const refreshed = await refresh.json();
            setTransaction(refreshed.transaction);
          }
        }
        addToast(`Delivery status updated to ${status.replace("_", " ")}`, "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Delivery update failed", "error");
      }
    } catch {
      addToast("Something went wrong", "error");
    } finally {
      setDeliveringItem(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction) return;
    setActionLoading(true);
    try {
      const revieweeId = transaction.buyerId === session?.user?.id
        ? transaction.sellerId
        : transaction.buyerId;

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          revieweeId,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        const refresh = await fetch(`/api/transactions/${transaction.id}`);
        if (refresh.ok) {
          const refreshed = await refresh.json();
          setTransaction(refreshed.transaction);
        }
        setShowReviewModal(false);
        setRating(5);
        setComment("");
        addToast("Review submitted successfully", "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to submit review", "error");
      }
    } catch {
      addToast("Something went wrong", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || rejectPhotos.length >= 3) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setRejectPhotos((prev) => [...prev, data.url]);
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleReject() {
    if (!rejectReason) return;
    handleStatusChange("rejected", {
      rejectionReason: rejectReason,
      rejectionPhotos: rejectPhotos,
    });
    setShowRejectForm(false);
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  if (!transaction) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-zinc-500">Transaction not found</p></div>;
  }

  const currentStepIndex = getStepIndex(transaction.status);
  const isBuyer = session?.user?.id === String(transaction.buyerId);
  const isSeller = session?.user?.id === String(transaction.sellerId);
  const isAdmin = session?.user?.role === "admin";

  const statusMessages: Record<string, { title: string; description: string }> = {
    payment_pending: { title: "Awaiting Payment", description: "Complete your payment to proceed." },
    payment_confirmed: { title: "Payment Confirmed", description: "Payment has been secured. You can now coordinate with the seller for handover." },
    seller_contacted: { title: "Seller Contacted", description: "The seller has been notified. Arrange handover." },
    item_delivered: { title: "Item Delivered", description: "The item has been handed over. Please inspect it." },
    inspection_pending: { title: "Awaiting Inspection", description: "Please inspect the item and confirm acceptance or report a problem." },
    accepted: { title: "Item Accepted", description: "You have accepted the item. The seller will be paid." },
    payout_pending: { title: "Payout Pending", description: "The seller payout is being processed." },
    payout_completed: { title: "Payout Completed", description: "The seller has been paid." },
    completed: { title: "Transaction Completed", description: "This transaction has been completed successfully." },
    rejected: { title: "Item Rejected", description: "The buyer has rejected the item." },
    disputed: { title: "Disputed", description: "This transaction is under dispute." },
    refund_pending: { title: "Refund Pending", description: "Your refund is being processed." },
    refund_completed: { title: "Refund Completed", description: "The refund has been processed successfully." },
  };

  const currentStatus = statusMessages[transaction.status] || { title: transaction.status, description: "" };
  const parsedPhotos: string[] = (() => {
    try {
      return transaction.rejectionPhotos ? JSON.parse(transaction.rejectionPhotos) : [];
    } catch {
      return [];
    }
  })();

  const statusVariantMap: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
    payment_pending: "warning",
    payment_confirmed: "primary",
    seller_contacted: "primary",
    item_delivered: "primary",
    inspection_pending: "warning",
    accepted: "success",
    payout_pending: "warning",
    payout_completed: "success",
    completed: "success",
    rejected: "danger",
    disputed: "danger",
    refund_pending: "warning",
    refund_completed: "success",
  };

  return (
    <div className="mx-auto max-w-2xl py-8 animate-fade-in">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Transaction #{transaction.id}</h1>
          <p className="text-sm text-zinc-500">{new Date(transaction.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Status Card */}
      <Card padding="none" className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">{currentStatus.title}</h2>
              <p className="text-sm text-white/80">{currentStatus.description}</p>
            </div>
            <Badge variant={statusVariantMap[transaction.status] || "default"} size="lg">
              {transaction.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        <div className="p-6">
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${isCompleted ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"} ${isCurrent ? "ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-zinc-950" : ""}`}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && <div className={`h-8 w-0.5 transition-colors ${isCompleted ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"}`} />}
                </div>
                <span className={`pt-0.5 text-sm ${isCurrent ? "font-semibold text-zinc-900 dark:text-zinc-50" : isCompleted ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-600"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Transaction Timeline */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <Clock className="h-4 w-4" />
            Transaction Timeline
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Transaction Created</p>
                <p className="text-xs text-zinc-500">{new Date(transaction.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${currentStepIndex >= 0 ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                <div className={`h-2 w-2 rounded-full ${currentStepIndex >= 0 ? "bg-indigo-600 dark:bg-indigo-400" : "bg-zinc-300 dark:bg-zinc-600"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Payment Pending</p>
                <p className="text-xs text-zinc-500">{new Date(transaction.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {currentStepIndex >= 1 && (
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Payment Confirmed</p>
                  <p className="text-xs text-zinc-500">{new Date(transaction.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
            {currentStepIndex >= 4 && (
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Item Delivered</p>
                  <p className="text-xs text-zinc-500">{new Date(transaction.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
            {currentStepIndex >= 5 && (
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Inspection Pending</p>
                  <p className="text-xs text-zinc-500">{new Date(transaction.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
            {["accepted", "payout_pending", "payout_completed", "completed"].includes(transaction.status) && (
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Item Accepted</p>
                  <p className="text-xs text-zinc-500">{new Date(transaction.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
            {["rejected", "disputed", "refund_pending", "refund_completed"].includes(transaction.status) && (
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <div className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {transaction.status === "rejected" ? "Item Rejected" : transaction.status === "disputed" ? "Disputed" : "Refunded"}
                  </p>
                  <p className="text-xs text-zinc-500">{new Date(transaction.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Tracking Card */}
      {transaction.status === "seller_contacted" && (
        <Card padding="lg" className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Delivery Tracking</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {deliveryTracking?.status === "in_transit"
                  ? "Your item is on the way"
                  : deliveryTracking?.status === "delivered"
                  ? "Item marked as delivered — awaiting your confirmation"
                  : "Arrange handover with the " + (isBuyer ? "seller" : "buyer")}
              </p>
            </div>
          </div>

          {deliveryTracking && deliveryTracking.status !== "shipping" && (
            <div className="space-y-3">
              {deliveryTracking.shippedAt && (
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <div className="h-2 w-2 rounded-full bg-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">In Transit</p>
                    <p className="text-xs text-zinc-500">{new Date(deliveryTracking.shippedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {deliveryTracking.deliveredAt && (
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <div className="h-2 w-2 rounded-full bg-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Delivered</p>
                    <p className="text-xs text-zinc-500">{new Date(deliveryTracking.deliveredAt).toLocaleString()}</p>
                    {deliveryTracking.deliveredNote && (
                      <p className="mt-1 text-xs text-zinc-500">Note: {deliveryTracking.deliveredNote}</p>
                    )}
                  </div>
                </div>
              )}
              {deliveryTracking.proofPhoto && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={deliveryTracking.proofPhoto} alt="Delivery proof" className="h-24 w-24 rounded-xl object-cover" />
                </div>
              )}
            </div>
          )}

          {deliveryTracking?.status === "confirmed" && (
            <div className="mt-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Delivery confirmed by buyer — proceeding to inspection
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="mb-8 space-y-3">
        {transaction.status === "seller_contacted" && isSeller && (
          <>
            {deliveryTracking && deliveryTracking.status === "shipping" && (
              <Button
                onClick={() => handleDeliveryUpdate("in_transit")}
                isLoading={deliveringItem}
                className="w-full"
              >
                <Package className="h-4 w-4" />
                {deliveringItem ? "Updating..." : "Mark as In Transit"}
              </Button>
            )}
            {deliveryTracking && deliveryTracking.status === "in_transit" && (
              <Button
                onClick={() => {
                  const photo = deliverProofPhoto;
                  if (photo) {
                    handleDeliveryUpdate("delivered", deliverProofPhoto ? undefined : undefined, photo);
                  } else {
                    handleDeliveryUpdate("delivered");
                  }
                }}
                isLoading={deliveringItem}
                className="w-full"
              >
                <Truck className="h-4 w-4" />
                {deliveringItem ? "Updating..." : "Mark as Delivered"}
              </Button>
            )}
            {!deliveryTracking && (
              <Button
                onClick={() => handleDeliveryUpdate("in_transit")}
                isLoading={deliveringItem}
                className="w-full"
              >
                <Package className="h-4 w-4" />
                {deliveringItem ? "Updating..." : "Mark as In Transit"}
              </Button>
            )}
          </>
        )}

        {deliveryTracking && deliveryTracking.status === "delivered" && isBuyer && (
          <Button
            onClick={() => handleDeliveryUpdate("confirmed")}
            isLoading={deliveringItem}
            className="w-full"
            variant="success"
          >
            <CheckCircle className="h-4 w-4" />
            {deliveringItem ? "Confirming..." : "Confirm Receipt"}
          </Button>
        )}

        {transaction.status === "item_delivered" && isBuyer && (
          <Button onClick={() => handleStatusChange("inspection_pending")} isLoading={actionLoading} className="w-full">
            <Search className="h-4 w-4" />
            {actionLoading ? "Updating..." : "I've Received the Item"}
          </Button>
        )}

        {transaction.status === "inspection_pending" && isBuyer && (
          <>
            <Button onClick={() => setShowAcceptModal(true)} isLoading={actionLoading} className="w-full" variant="success">
              <ThumbsUp className="h-4 w-4" />
              Accept Item
            </Button>
            <Button onClick={() => setShowRejectForm(true)} isLoading={actionLoading} className="w-full" variant="destructive" outline>
              <ThumbsDown className="h-4 w-4" />
              Report Problem
            </Button>
          </>
        )}

        {transaction.status === "rejected" && (isSeller || isAdmin) && (
          <Button onClick={() => handleStatusChange("disputed")} isLoading={actionLoading} className="w-full" variant="outline">
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {actionLoading ? "Updating..." : "Escalate to Dispute"}
          </Button>
        )}

        {(transaction.status === "rejected" || transaction.status === "disputed") && isAdmin && (
          <Button onClick={() => handleStatusChange("refund_pending")} isLoading={actionLoading} className="w-full" variant="warning">
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            {actionLoading ? "Updating..." : "Approve Refund"}
          </Button>
        )}

        {transaction.status === "refund_pending" && isAdmin && (
          <Button onClick={() => handleStatusChange("refund_completed")} isLoading={actionLoading} className="w-full">
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            {actionLoading ? "Initiating Refund..." : "Initiate Refund"}
          </Button>
        )}

        {transaction.status === "payout_pending" && isAdmin && (
          <Button onClick={() => handleStatusChange("payout_completed")} isLoading={actionLoading} className="w-full">
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            {actionLoading ? "Initiating Payout..." : "Initiate Payout"}
          </Button>
        )}

        {transaction.status === "payout_completed" && isAdmin && (
          <Button onClick={() => handleStatusChange("completed")} isLoading={actionLoading} className="w-full">
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {actionLoading ? "Updating..." : "Complete Transaction"}
          </Button>
        )}
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <Card padding="none" className="mb-8 overflow-hidden border-emerald-200 dark:border-emerald-800">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <ShieldCheck className="h-5 w-5" />
              Confirm Acceptance
            </h3>
          </div>
          <div className="p-6">
            <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-300">
              Are you sure you want to accept this item? This will release {formatPrice(transaction.itemPrice, transaction.currency)} to the seller.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => { handleStatusChange("accepted"); setShowAcceptModal(false); }} isLoading={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {actionLoading ? "Processing..." : "Yes, Accept"}
              </Button>
              <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Reject Form */}
      {showRejectForm && (
        <Card padding="none" className="mb-8 overflow-hidden border-red-200 dark:border-red-800">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <AlertTriangle className="h-5 w-5" />
              Report a Problem
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-red-800 dark:text-red-200">Reason</label>
              <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full rounded-xl border border-red-300 px-3 py-2.5 text-sm text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-700 dark:bg-red-900/40 dark:text-red-100">
                <option value="">Select a reason...</option>
                {REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-red-800 dark:text-red-200">
                <span className="flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Photos (optional, max 3)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {rejectPhotos.map((url, i) => (
                  <div key={i} className="relative h-16 w-16">
                    <Image src={url} alt={`Evidence ${i + 1}`} fill className="rounded-xl object-cover" sizes="64px" />
                    <button onClick={() => setRejectPhotos((prev) => prev.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow-sm">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {rejectPhotos.length < 3 && (
                  <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-red-300 text-red-400 transition-colors hover:border-red-400 hover:bg-red-100/50 dark:border-red-700">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleReject} disabled={!rejectReason || actionLoading} variant="destructive">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                {actionLoading ? "Submitting..." : "Submit Report"}
              </Button>
              <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Rejection Details */}
      {transaction.status === "rejected" && transaction.rejectionReason && (
        <Card padding="none" className="mb-8 overflow-hidden border-red-200 dark:border-red-800">
          <div className="border-b border-red-100 bg-red-50 px-6 py-3 dark:border-red-900 dark:bg-red-900/10">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Rejection Details
            </h3>
          </div>
          <div className="p-6">
            <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300"><strong>Reason:</strong> {transaction.rejectionReason}</p>
            {parsedPhotos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {parsedPhotos.map((url, i) => (
                  <Image key={i} src={url} alt={`Evidence ${i + 1}`} width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Payout Details */}
      {(transaction.status === "payout_pending" || transaction.status === "payout_completed" || transaction.status === "completed") && (
        <Card padding="none" className="mb-8 overflow-hidden">
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <Banknote className="h-4 w-4" />
              Seller Payout
            </h3>
          </div>
          <div className="p-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Seller receives</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatPrice(transaction.itemPrice, transaction.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Payout status</span>
              <Badge variant={transaction.payout?.status === "completed" ? "success" : "warning"} size="sm">
                {transaction.payout?.status || "pending"}
              </Badge>
            </div>
            {transaction.payout?.paidAt && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Paid at</span>
                <span>{new Date(transaction.payout.paidAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Refund Details */}
      {(transaction.status === "refund_pending" || transaction.status === "refund_completed") && (
        <Card padding="none" className="mb-8 overflow-hidden border-amber-200 dark:border-amber-800">
          <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 dark:border-amber-900 dark:bg-amber-900/10">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <Banknote className="h-4 w-4" />
              Refund
            </h3>
          </div>
          <div className="p-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Refund amount</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{formatPrice(transaction.refund?.amount || transaction.totalAmount, transaction.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Refund status</span>
              <Badge variant={transaction.refund?.status === "completed" ? "success" : "warning"} size="sm">
                {transaction.refund?.status || "pending"}
              </Badge>
            </div>
            {transaction.refund?.reason && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Reason</span>
                <span>{transaction.refund.reason}</span>
              </div>
            )}
          </div>
        </Card>
       )}

      {(transaction.status === "completed" || transaction.status === "refund_completed") &&
       !transaction.review && (
        <Card padding="lg" className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Rate Your Transaction Partner
          </h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            You've completed a transaction with{" "}
            {transaction.buyerId === session?.user?.id
              ? transaction.seller?.name
              : transaction.buyer?.name}.
            Leave a rating to help build trust in the community.
          </p>
          <Button
            onClick={() => setShowReviewModal(true)}
            size="sm"
            className="w-full sm:w-auto"
          >
            <ThumbsUp className="h-4 w-4" />
            Write a Review
          </Button>
        </Card>
      )}

      {transaction.review && (
        <Card padding="lg" className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Your Review
          </h3>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <ThumbsUp
                key={i}
                className={`h-4 w-4 ${
                  i < transaction.review!.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-zinc-300"
                }`}
              />
            ))}
          </div>
          {transaction.review.comment && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {transaction.review.comment}
            </p>
          )}
        </Card>
      )}

      {/* Product Info */}
      {transaction.product && (
        <Card padding="none" className="mb-8 overflow-hidden">
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <Package className="h-4 w-4" />
              Product Details
            </h3>
          </div>
          <div className="p-6">
            <div className="flex gap-4">
              {transaction.product.images[0] && (
                <Image src={transaction.product.images[0].imageUrl} alt={transaction.product.title} width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />
              )}
              <div>
                <Link href={`/products/${transaction.product.id}`} className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                  {transaction.product.title}
                  <ChevronRight className="h-3 w-3" />
                </Link>
                <p className="mt-1 text-sm text-zinc-500">{formatCondition(transaction.product.condition)}</p>
                <p className="text-sm text-zinc-500">{transaction.product.location}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Info */}
      <Card padding="none" className="mb-8 overflow-hidden">
        <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <CreditCard className="h-4 w-4" />
            Payment Details
          </h3>
        </div>
        <div className="p-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Item price</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatPrice(transaction.itemPrice, transaction.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Service fee (10%)</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatPrice(transaction.serviceFee, transaction.currency)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(transaction.totalAmount, transaction.currency)}</span>
          </div>
          {transaction.payment && (
            <>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Payment status</span>
                <Badge variant={transaction.payment.status === "successful" ? "success" : "warning"} size="sm">
                  {transaction.payment.status}
                </Badge>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Contact Info */}
      {currentStepIndex >= 1 && transaction.buyer && transaction.seller && (
        <Card padding="none" className="mb-8 overflow-hidden">
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <MessageSquare className="h-4 w-4" />
              {isBuyer ? "Seller Contact" : "Buyer Contact"}
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={undefined}
                fallback={isBuyer ? transaction.seller.name : transaction.buyer.name}
                size="lg"
              />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {isBuyer ? transaction.seller.name : transaction.buyer.name}
                </p>
                {(isBuyer ? transaction.seller.phone : transaction.buyer.phone) && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {isBuyer ? transaction.seller.phone : transaction.buyer.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
         </Card>
       )}

       {/* In-App Chat */}
       {currentStepIndex >= 1 && transaction.buyer && transaction.seller && (
         <Card padding="none" className="mb-8 overflow-hidden">
           <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
             <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
               <MessageSquare className="h-4 w-4" />
               Messages
             </h3>
           </div>
           <div className="p-6">
             <ChatBox transactionId={transaction.id} />
           </div>
         </Card>
       )}

       {showReviewModal && transaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Write a Review
            </h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Rating
                </label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      value={i + 1}
                      onClick={() => setRating(i + 1)}
                      className="p-0.5 hover:scale-110 transition-transform"
                    >
                      <ThumbsUp
                        className={`h-6 w-6 ${
                          i < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-zinc-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike?"
                  rows={3}
                  className="block w-full rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={actionLoading}>
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
      <TransactionContent />
    </Suspense>
  );
}
