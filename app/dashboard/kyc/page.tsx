"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "driver_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
];

interface KycRecord {
  id: string;
  status: "pending" | "verified" | "rejected";
  documentType: string;
  documentNumber: string | null;
  documentImageUrl: string;
  selfieImageUrl: string | null;
  adminNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export default function KycPage() {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchKyc() {
      try {
        const res = await fetch("/api/kyc");
        if (res.ok) {
          const data = await res.json();
          if (data.kyc) {
            setKyc({
              id: data.kyc.id,
              status: data.kyc.status,
              documentType: data.kyc.documentType,
              documentNumber: data.kyc.documentNumber,
              documentImageUrl: data.kyc.documentImageUrl,
              selfieImageUrl: data.kyc.selfieImageUrl,
              adminNote: data.kyc.adminNote,
              submittedAt: new Date(data.kyc.submittedAt).toISOString(),
              reviewedAt: data.kyc.reviewedAt ? new Date(data.kyc.reviewedAt).toISOString() : null,
            });
          }
        }
      } catch {
        addToast("Failed to load KYC data", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchKyc();
  }, [addToast]);

  const statusConfig = {
    verified: {
      icon: CheckCircle,
      badge: "success" as const,
      title: "Identity Verified",
      description: "Your identity has been verified. You can now list products on PassitOn.",
    },
    pending: {
      icon: Clock,
      badge: "warning" as const,
      title: "Verification Under Review",
      description: "Your KYC documents have been submitted and are being reviewed by our team. This typically takes 1-2 business days.",
    },
    rejected: {
      icon: XCircle,
      badge: "danger" as const,
      title: "Verification Rejected",
      description: kyc?.adminNote || "Your KYC documents were not accepted. Please review the feedback and resubmit.",
    },
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Card padding="lg">
          <EmptyState
            icon="inbox"
            title="Loading..."
            description="Checking your KYC status."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Identity Verification (KYC)
        </h1>
        <Link href="/dashboard/profile">
          <Button variant="outline" size="sm">
            Back to Profile
          </Button>
        </Link>
      </div>

      {kyc && statusConfig[kyc.status] ? (
        <Card padding="lg">
          <div className="flex items-start gap-4">
            {(() => {
              const cfg = statusConfig[kyc.status];
              const Icon = cfg.icon;
              return (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                      {cfg.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {cfg.description}
                    </p>
                    {kyc.status === "pending" && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <Clock className="h-4 w-4" />
                        <span>
                          Submitted: {new Date(kyc.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {kyc.status === "verified" && kyc.reviewedAt && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Verified: {new Date(kyc.reviewedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant={cfg.badge} size="lg">
                    {kyc.status.charAt(0).toUpperCase() + kyc.status.slice(1)}
                  </Badge>
                </>
              );
            })()}
          </div>
        </Card>
      ) : (
        <Card padding="lg">
          <EmptyState
            icon="inbox"
            title="Not Verified"
            description="Complete KYC verification to unlock selling on PassitOn."
          />
        </Card>
      )}

      {(kyc === null || kyc.status === "rejected") && (
        <KycSubmissionForm onSubmitted={() => {
          fetch("/api/kyc")
            .then((r) => r.json())
            .then((data) => {
              if (data.kyc) {
                setKyc({
                  id: data.kyc.id,
                  status: data.kyc.status,
                  documentType: data.kyc.documentType,
                  documentNumber: data.kyc.documentNumber,
                  documentImageUrl: data.kyc.documentImageUrl,
                  selfieImageUrl: data.kyc.selfieImageUrl,
                  adminNote: data.kyc.adminNote,
                  submittedAt: new Date(data.kyc.submittedAt).toISOString(),
                  reviewedAt: data.kyc.reviewedAt ? new Date(data.kyc.reviewedAt).toISOString() : null,
                });
              }
            });
        }} />
      )}
    </div>
  );
}

function KycSubmissionForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [documentType, setDocumentType] = useState("passport");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentImageUrl, setDocumentImageUrl] = useState("");
  const [selfieImageUrl, setSelfieImageUrl] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  async function handleUpload(type: "document" | "selfie") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = (input as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(type);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "skillbridge/kyc");

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (type === "document") {
            setDocumentImageUrl(data.url);
          } else {
            setSelfieImageUrl(data.url);
          }
          addToast(`Upload successful`, "success");
        } else {
          const data = await res.json();
          addToast(data.error || "Upload failed", "error");
        }
      } catch {
        addToast("Upload failed. Please try again.", "error");
      } finally {
        setUploading(null);
      }
    };
    input.click();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!documentImageUrl) {
      addToast("Please upload your ID document", "error");
      return;
    }
    if (!selfieImageUrl) {
      addToast("Please upload a selfie", "error");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          documentNumber,
          documentImageUrl,
          selfieImageUrl,
        }),
      });

      if (res.ok) {
        addToast("KYC submitted successfully. Under review.", "success");
        onSubmitted();
      } else {
        const data = await res.json();
        addToast(data.error || "Submission failed", "error");
      }
    } catch {
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="lg">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Submit Your Documents
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Upload a clear photo of your government-issued ID and a selfie for identity verification.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            required
          >
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Document Number
          </label>
          <Input
            type="text"
            placeholder="Enter your ID number"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ID Document Photo
          </label>
          <div className="mt-2 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpload("document")}
              isLoading={uploading === "document"}
              disabled={uploading !== null}
            >
              <Upload className="h-4 w-4 mr-2" />
              {documentImageUrl ? "Change Document" : "Upload Document"}
            </Button>
            {documentImageUrl && (
              <a
                href={documentImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                View uploaded document
              </a>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Selfie Photo
          </label>
          <div className="mt-2 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpload("selfie")}
              isLoading={uploading === "selfie"}
              disabled={uploading !== null}
            >
              <Upload className="h-4 w-4 mr-2" />
              {selfieImageUrl ? "Change Selfie" : "Upload Selfie"}
            </Button>
            {selfieImageUrl && (
              <a
                href={selfieImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                View selfie
              </a>
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            isLoading={submitting}
            disabled={!documentImageUrl || !selfieImageUrl || submitting}
          >
            {submitting ? "Submitting..." : "Submit KYC for Review"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
