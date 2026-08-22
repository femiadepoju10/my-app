"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function BioEditor({ sellerId, currentBio }: { sellerId: string; currentBio: string | null }) {
  const [bio, setBio] = useState(currentBio || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bio.slice(0, 500) }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 500))}
        placeholder="Write a short bio..."
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {bio.length}/500 characters
        </span>
        <Button size="sm" onClick={handleSave} isLoading={saving}>
          {saved ? "Saved!" : "Save Bio"}
        </Button>
      </div>
    </div>
  );
}
