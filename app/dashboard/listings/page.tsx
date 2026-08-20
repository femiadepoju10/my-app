"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatCondition } from "@/lib/utils";

interface ProductImage {
  imageUrl: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  condition: string;
  location: string;
  status: string;
  createdAt: string;
  images: ProductImage[];
}

export default function MyListingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

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

  async function handleDelete(id: number) {
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

  const statusColor: Record<string, string> = {
    active:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    reserved:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    sold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    removed: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          My Listings
        </h1>
        <Link
          href="/products/sell"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New Listing
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">
          <p>You have no listings yet.</p>
          <Link
            href="/products/sell"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
          >
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
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
                <p className="mt-0.5 text-sm text-emerald-600 dark:text-emerald-400">
                  {formatPrice(product.price)}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{formatCondition(product.condition)}</span>
                  <span>{product.location}</span>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[product.status] ?? ""}`}
              >
                {product.status}
              </span>

              <div className="flex gap-2">
                {product.status === "active" && (
                  <>
                    <Link
                      href={`/dashboard/listings/${product.id}/edit`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      {deleting === product.id ? "..." : "Remove"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
