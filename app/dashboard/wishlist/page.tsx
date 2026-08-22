"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";

interface WishlistItem {
  id: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    price: number;
    currency?: string;
    condition: string;
    location: string;
    status: string;
    images: { imageUrl: string }[];
    seller: { name: string };
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWishlist() {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlists || []);
      }
      setLoading(false);
    }
    fetchWishlist();
  }, []);

  async function handleRemove(productId: string, wishlistId: string) {
    setRemoving(wishlistId);
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((w) => w.id !== wishlistId));
      }
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card padding="lg" className="max-w-md">
        <EmptyState
          icon="heart"
          title="Your wishlist is empty"
          description="Save items you're interested in by clicking the heart icon on any product."
        />
        <Link href="/products" className="mt-4 block">
          <Button variant="primary" className="w-full">
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        My Wishlist
      </h1>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} padding="none" className="group overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              {item.product.images[0] && (
                <Image
                  src={item.product.images[0].imageUrl}
                  alt={item.product.title}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.id}`}>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {item.product.title}
                  </h3>
                </Link>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {item.product.seller.name}
                </p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {formatPrice(item.product.price, item.product.currency)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.product.status === "active" ? "success" : "warning"} size="sm">
                  {item.product.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(item.product.id, item.id)}
                  isLoading={removing === item.id}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
