"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WishlistButton({ productId, className, size = "md" }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkWishlist() {
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          const found = data.wishlists?.some(
            (w: { product?: { id: string } }) => w.product?.id === productId
          );
          setInWishlist(found || false);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    checkWishlist();
  }, [productId]);

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    try {
      if (inWishlist) {
        const res = await fetch(`/api/wishlist?productId=${productId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setInWishlist(false);
        }
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          setInWishlist(true);
        }
      }
    } catch {
      // silent
    }
  }

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      type="button"
      onClick={toggleWishlist}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/90 shadow-md transition-all hover:scale-110 dark:bg-zinc-800",
        inWishlist ? "text-rose-500" : "text-zinc-400 hover:text-rose-400",
        className
      )}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`${sizeClasses[size]} ${inWishlist ? "fill-current" : ""}`}
      />
    </button>
  );
}
