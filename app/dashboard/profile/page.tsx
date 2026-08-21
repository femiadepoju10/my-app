"use client";

import { useState, useEffect } from "react";
import { User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.user.phone || "");
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
        body: JSON.stringify({ name, email, phone }),
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
    </div>
  );
}
