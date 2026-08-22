"use client";

import { useState, useEffect } from "react";
import { User, Loader2, Banknote, Trash2, Bell, Shield } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import PushNotificationToggle from "@/components/notifications/PushNotificationToggle";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  smsEnabled: boolean;
  role: string;
  paystackRecipientCode: string | null;
  kycDocument: {
    status: string;
    documentType: string;
    adminNote: string | null;
    reviewedAt: string | null;
    submittedAt: string;
  } | null;
  createdAt: string;
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

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.user.phone || "");
        setBio(data.user.bio || "");
        setSmsEnabled(data.user.smsEnabled || false);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, bio, smsEnabled }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully" });
      } else {
        const data = await res.json();
        let errorMsg = "Failed to update profile";
        if (typeof data.error === "string") {
          errorMsg = data.error;
        } else if (typeof data.error === "object" && data.error !== null) {
          const firstKey = Object.keys(data.error)[0];
          if (firstKey && Array.isArray(data.error[firstKey])) {
            errorMsg = data.error[firstKey][0];
          }
        }
        setMessage({ type: "error", text: errorMsg });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handlePayoutSetup(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paystackRecipientCode) {
          setUser((prev) => prev ? { ...prev, paystackRecipientCode: data.paystackRecipientCode } : null);
          setMessage({ type: "success", text: "Payout recipient set up successfully!" });
          setAccountNumber("");
          setBankCode("");
        }
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to set up payout" });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleClearPayout() {
    if (!confirm("Are you sure you want to remove your payout setup? You won't receive payouts until you set it up again.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearPaystackRecipient: true }),
      });
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, paystackRecipientCode: null } : null);
        setMessage({ type: "success", text: "Payout setup removed" });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-zinc-500">Loading...</div>;
  }

  if (!user) {
    return <div className="py-20 text-center text-zinc-500">Profile not found</div>;
  }

  return (
    <div className="animate-fade-in max-w-lg">
      <Card padding="lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Profile</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage your account settings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <Badge variant={message.type === "success" ? "success" : "danger"}>
              {message.text}
            </Badge>
          )}

          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
          />

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder="Tell buyers about yourself..."
              rows={3}
              maxLength={500}
              className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <p className="mt-1 text-xs text-zinc-400">
              {bio.length}/500 characters
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button type="submit" isLoading={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <span className="text-xs text-zinc-500">
              Role: {user.role} | Member since {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
         </form>
       </Card>

       {user.role !== "admin" && (
         <Card padding="lg" className="mt-6">
           <div className="mb-4 flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
               <Banknote className="h-5 w-5" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Payout Setup</h2>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">Connect your bank account to receive seller payouts</p>
             </div>
           </div>

           {user.paystackRecipientCode ? (
             <div className="space-y-4">
               <div className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                 <div>
                   <Badge variant="success" size="sm">Ready</Badge>
                   <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                     Recipient: {user.paystackRecipientCode}
                   </p>
                 </div>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleClearPayout}
                   isLoading={saving}
                 >
                   <Trash2 className="h-3 w-3" />
                   Remove
                 </Button>
               </div>
               <p className="text-xs text-zinc-500 dark:text-zinc-400">
                 Your payout recipient is set up. When a buyer accepts an item, your payout will be automatically initiated via Paystack.
               </p>
             </div>
           ) : (
             <form onSubmit={handlePayoutSetup} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                   Bank
                 </label>
                 <select
                   value={bankCode}
                   onChange={(e) => setBankCode(e.target.value)}
                   className="block w-full rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
               <Input
                 label="Account Number"
                 type="text"
                 placeholder="0123456789"
                 value={accountNumber}
                 onChange={(e) => setAccountNumber(e.target.value)}
                 required
               />
               <Button
                 type="submit"
                 isLoading={saving}
                 disabled={!accountNumber || !bankCode}
               >
                 {saving ? "Setting Up..." : "Set Up Payout Recipient"}
               </Button>
             </form>
            )}
          </Card>
        )}

        <Card padding="lg" className="mt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Push Notifications
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Receive real-time notifications about your transactions
              </p>
            </div>
          </div>
          <PushNotificationToggle />
        </Card>

        <Card padding="lg" className="mt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                SMS Notifications
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Receive critical alerts (payments, disputes, refunds, payouts) via SMS. Standard SMS rates may apply.
              </p>
            </div>
          </div>

          {!user.phone ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Set a phone number above to enable SMS notifications.
            </p>
          ) : (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Enable SMS notifications to {user.phone}
              </span>
            </label>
          )}
        </Card>

        {user.role !== "admin" && (
          <Card padding="lg" className="mt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Identity Verification (KYC)</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Verify your identity to list products for sale</p>
              </div>
            </div>

            {user.kycDocument ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {user.kycDocument.status === "verified" && "Verified"}
                      {user.kycDocument.status === "pending" && "Under Review"}
                      {user.kycDocument.status === "rejected" && "Rejected"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Document: {user.kycDocument.documentType}
                      {user.kycDocument.reviewedAt && ` · Reviewed ${new Date(user.kycDocument.reviewedAt).toLocaleDateString()}`}
                    </p>
                  </div>
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
                    {user.kycDocument.status}
                  </Badge>
                </div>
                {user.kycDocument.adminNote && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Note: {user.kycDocument.adminNote}
                  </p>
                )}
                <Link href="/dashboard/kyc">
                  <Button variant="outline" size="sm">
                    {user.kycDocument.status === "rejected" ? "Resubmit Documents" : "Manage KYC"}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  You must verify your identity before you can list products for sale.
                </p>
                <Link href="/dashboard/kyc">
                  <Button variant="primary" size="sm">
                    Start KYC Verification
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }
