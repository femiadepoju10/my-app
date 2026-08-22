"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatCondition } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Package, Plus, Loader2 } from "lucide-react";

interface ProductImage {
  imageUrl: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  location: string;
  status: string;
  createdAt: string;
  images: ProductImage[];
}

const statusVariantMap: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  active: "success",
  reserved: "warning",
  sold: "primary",
  removed: "default",
};

export default function MyListingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      const res = await fetch("/api/products?mine=true");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
      setLoading(false);
    }
    fetchListings();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this listing?")) return;
    setDeleting(id);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "removed" } : p))
      );
    }
    setDeleting(null);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          My Listings
        </h1>
        <Button href="/products/sell" size="sm">
          <Plus className="h-4 w-4" />
          New Listing
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="package"
          title="No listings yet"
          description="Create your first listing to start selling on the marketplace."
          action={
            <Button href="/products/sell">
              <Plus className="h-4 w-4" />
              Create Listing
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} hover padding="none" className="overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0].imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                      No img
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${product.id}`}
                    className="text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {formatPrice(product.price)}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{formatCondition(product.condition)}</span>
                    <span>{product.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={statusVariantMap[product.status] || "default"} size="sm">
                    {product.status}
                  </Badge>

                  {product.status === "active" && (
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/listings/${product.id}/edit`}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Edit
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        isLoading={deleting === product.id}
                      >
                        {deleting === product.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remove"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
