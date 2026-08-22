"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export function ApplySuggestionButton({
  disputeId,
  suggestedResolution,
}: {
  disputeId: string;
  suggestedResolution: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApply() {
    if (!confirm(`Apply suggested resolution: ${suggestedResolution.replace(/_/g, " ")}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "refunded",
          resolution: `Auto-resolved: ${suggestedResolution}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to apply suggestion");
      } else {
        router.refresh();
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="default" onClick={handleApply} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Apply Suggestion
    </Button>
  );
}
