"use client";

import { useState } from "react";

interface ReviewSectionProps {
  productId: number;
  isCompleted: boolean;
  isBuyer: boolean;
  transactionId: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerId: number;
}

export default function ReviewSection({ productId, isCompleted, isBuyer, transactionId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  async function loadReviews() {
    if (loaded) return;
    const res = await fetch(`/api/reviews?productId=${productId}`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
      setLoaded(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, rating, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Review submitted!" });
        setShowForm(false);
        setHasReviewed(true);
        setRating(0);
        setComment("");
        setLoaded(false);
        setReviews([]);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to submit review" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div
      className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      onMouseEnter={loadReviews}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-sm ${star <= Math.round(avgRating) ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`}>
                ★
              </span>
            ))}
            <span className="ml-1 text-xs text-zinc-500">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {message && (
        <div className={`mt-3 rounded-lg p-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
          {message.text}
        </div>
      )}

      {isCompleted && isBuyer && !hasReviewed && !showForm && (
        <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          Leave a Review
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className={`text-2xl ${star <= (hoveredStar || rating) ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: Share your experience..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <div className="flex gap-3">
            <button type="submit" disabled={rating === 0 || submitting} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length > 0 && (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-xs ${star <= review.rating ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`}>
                    ★
                  </span>
                ))}
                <span className="ml-2 text-xs text-zinc-400">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              {review.comment && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {loaded && reviews.length === 0 && (
        <p className="mt-3 text-sm text-zinc-400">No reviews yet</p>
      )}
    </div>
  );
}
