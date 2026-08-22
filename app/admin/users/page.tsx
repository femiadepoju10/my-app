"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { Loader2, Search, UserPlus, Shield, Trash2, Banknote } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

 interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    paystackRecipientCode: string | null;
    sellerVerificationStatus: string | null;
    verificationNote: string | null;
    verifiedAt: string | null;
    kycDocument: {
      status: string;
      documentType: string;
      documentNumber: string | null;
      documentImageUrl: string;
      selfieImageUrl: string | null;
      adminNote: string | null;
      submittedAt: string;
      reviewedAt: string | null;
    } | null;
    createdAt: string;
    transactionCount: number;
}

const NIGERIAN_BANKS = [
  { code: "000001", name: "Access Bank" },
  { code: "000007", name: "Fcmb" },
  { code: "000009", name: "First Bank" },
  { code: "000010", name: "GTBank" },
  { code: "000013", name: "Jaiz Bank" },
  { code: "000014", name: "Kuda Bank" },
  { code: "000015", name: "Polaris Bank" },
  { code: "000016", name: "Stanbic IBTC" },
  { code: "000017", name: "Sterling Bank" },
  { code: "000018", name: "Suntrust Bank" },
  { code: "000019", name: "Taj Bank" },
  { code: "000020", name: "Union Bank" },
  { code: "000021", name: "UBA" },
  { code: "000022", name: "Unity Bank" },
  { code: "000023", name: "Wema Bank" },
  { code: "000024", name: "Zenith Bank" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [payoutSetupUser, setPayoutSetupUser] = useState<User | null>(null);
  const [kycReviewUser, setKycReviewUser] = useState<User | null>(null);
  const [kycAction, setKycAction] = useState<"verified" | "rejected">("verified");
  const [kycNote, setKycNote] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showPendingKycOnly, setShowPendingKycOnly] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  async function toggleRole(userId: string, currentRole: string, userName: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "promote" : "demote";
    if (!confirm(`Are you sure you want to ${action} ${userName}?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to remove ${userName}? This action can be undone by an admin.`)) return;
    setDeleteLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } finally {
      setDeleteLoading(null);
    }
  }

  async function handlePayoutSetup(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accountNumber,
          bankCode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, paystackRecipientCode: data.paystackRecipientCode || null }
              : u
          )
        );
        setPayoutSetupUser(null);
        setAccountNumber("");
        setBankCode("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to set up payout");
      }
    } finally {
      setActionLoading(null);
     }
   }

  async function handleKycReview(userId: string, status: "verified" | "rejected") {
    setKycAction(status);
    setKycNote("");
    const user = users.find((u) => u.id === userId);
    if (user) setKycReviewUser(user);
  }

  async function submitKycReview() {
    if (!kycReviewUser) return;
    setActionLoading(kycReviewUser.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: kycReviewUser.id,
          kycStatus: kycAction,
          kycAdminNote: kycNote,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === kycReviewUser.id
              ? {
                  ...u,
                  sellerVerificationStatus: kycAction,
                  kycDocument: u.kycDocument
                    ? { ...u.kycDocument, status: kycAction, adminNote: kycNote, reviewedAt: new Date().toISOString() }
                    : null,
                  verifiedAt: data.verifiedAt ?? null,
                }
              : u
          )
        );
        addToast(`KYC ${kycAction}`, "success");
        setKycReviewUser(null);
        setKycNote("");
      } else {
        const data = await res.json();
        addToast(data.error || "KYC review failed", "error");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleVerification(userId: string, status: "verified" | "rejected", userName: string) {
    let note = "";
    if (status === "rejected") {
      note = prompt(`Enter rejection reason for ${userName}:`) || "";
      if (!note) return;
    }
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sellerVerificationStatus: status, verificationNote: note }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  sellerVerificationStatus: status,
                  verificationNote: note,
                  ...(data.verifiedAt && { verifiedAt: data.verifiedAt }),
                }
              : u
          )
        );
        addToast(`Seller ${status}`, "success");
      } else {
        const data = await res.json();
        addToast(data.error || "Verification update failed", "error");
      }
    } finally {
      setActionLoading(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = showPendingOnly
      ? u.sellerVerificationStatus === "pending"
      : true;
    const matchesKycFilter = showPendingKycOnly
      ? u.kycDocument?.status === "pending"
      : true;
    return matchesSearch && matchesFilter && matchesKycFilter;
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          User Management
        </h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
           <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showPendingOnly}
              onChange={(e) => setShowPendingOnly(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            Pending verification only
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showPendingKycOnly}
              onChange={(e) => setShowPendingKycOnly(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            Pending KYC only
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="inbox"
            title="No users found"
            description={search ? "Try adjusting your search terms." : "There are no users in the system yet."}
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">User</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Phone</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
               <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Transactions</th>
                 <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Payout</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Verification</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">KYC</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Joined</th>
               <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={undefined}
                        fallback={user.name}
                        size="sm"
                      />
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "primary" : "default"} size="sm">
                      {user.role}
                    </Badge>
                  </td>
               <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.transactionCount}</td>
               <td className="px-4 py-3">
                 {user.paystackRecipientCode ? (
                   <Badge variant="success" size="sm">Ready</Badge>
                 ) : (
                   <Badge variant="warning" size="sm">Not Set Up</Badge>
                 )}
                </td>
               <td className="px-4 py-3">
                 {user.sellerVerificationStatus === "verified" ? (
                   <Badge variant="success" size="sm">Verified</Badge>
                 ) : user.sellerVerificationStatus === "pending" ? (
                   <Badge variant="warning" size="sm">Pending</Badge>
                 ) : user.sellerVerificationStatus === "rejected" ? (
                   <Badge variant="danger" size="sm">Rejected</Badge>
                 ) : (
                   <Badge variant="default" size="sm">—</Badge>
                 )}
               </td>
                <td className="px-4 py-3">
                  {user.kycDocument ? (
                    <Badge
                      variant={
                        user.kycDocument.status === "verified"
                          ? "success"
                          : user.kycDocument.status === "pending"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                    >
                      {user.kycDocument.status.charAt(0).toUpperCase() + user.kycDocument.status.slice(1)}
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">Not Submitted</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.sellerVerificationStatus === "pending" && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleVerification(user.id, "verified", user.name)}
                          isLoading={actionLoading === user.id}
                        >
                          Verify
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleVerification(user.id, "rejected", user.name)}
                          isLoading={actionLoading === user.id}
                          outline
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {user.sellerVerificationStatus === "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerification(user.id, "verified", user.name)}
                        isLoading={actionLoading === user.id}
                      >
                        Re-verify
                      </Button>
                    )}
                    {user.kycDocument && user.kycDocument.status === "pending" && (
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handleKycReview(user.id, "verified")}
                        isLoading={actionLoading === user.id}
                      >
                        Review KYC
                      </Button>
                    )}
                    {!user.paystackRecipientCode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPayoutSetupUser(user)}
                      >
                        <Banknote className="h-3 w-3" />
                        Set Up Payout
                      </Button>
                    )}
                    <Button
                      variant={user.role === "admin" ? "destructive" : "primary"}
                      size="sm"
                      onClick={() => toggleRole(user.id, user.role, user.name)}
                      isLoading={actionLoading === user.id}
                    >
                      <Shield className="h-3 w-3" />
                      {user.role === "admin" ? "Demote" : "Promote"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.name)}
                      isLoading={deleteLoading === user.id}
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </Button>
                   </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {kycReviewUser && kycReviewUser.kycDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              KYC Review: {kycReviewUser.name}
            </h3>
            <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Document Type: <strong>{kycReviewUser.kycDocument.documentType}</strong></p>
              {kycReviewUser.kycDocument.documentNumber && (
                <p>Document Number: <strong>{kycReviewUser.kycDocument.documentNumber}</strong></p>
              )}
              <p>Submitted: {new Date(kycReviewUser.kycDocument.submittedAt).toLocaleDateString()}</p>
            </div>
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">ID Document:</p>
              <img
                src={kycReviewUser.kycDocument.documentImageUrl}
                alt="ID Document"
                className="max-h-48 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 object-contain"
              />
            </div>
            {kycReviewUser.kycDocument.selfieImageUrl && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Selfie:</p>
                <img
                  src={kycReviewUser.kycDocument.selfieImageUrl}
                  alt="Selfie"
                  className="max-h-48 w-48 rounded-lg border border-zinc-200 dark:border-zinc-700 object-contain"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Admin Note (required for rejection)
              </label>
              <textarea
                value={kycNote}
                onChange={(e) => setKycNote(e.target.value)}
                placeholder={kycAction === "rejected" ? "Reason for rejection..." : "Optional note..."}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setKycReviewUser(null);
                  setKycNote("");
                  setKycAction("verified");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { setKycAction("rejected"); }}
                className="mr-auto"
              >
                Set to Reject
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={submitKycReview}
                isLoading={actionLoading === kycReviewUser.id}
              >
                Confirm {kycAction === "verified" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {payoutSetupUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Set Up Payout for {payoutSetupUser.name}
            </h3>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Enter the seller's Nigerian bank account details to create a Paystack transfer recipient.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Bank
                </label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">Select bank</option>
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Account Number
                </label>
                <Input
                  type="text"
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPayoutSetupUser(null);
                  setAccountNumber("");
                  setBankCode("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handlePayoutSetup(payoutSetupUser.id)}
                isLoading={actionLoading === payoutSetupUser.id}
                disabled={!accountNumber || !bankCode}
              >
                {actionLoading === payoutSetupUser.id ? "Setting Up..." : "Create Payout Recipient"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
