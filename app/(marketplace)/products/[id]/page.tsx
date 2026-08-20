"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { formatPrice, formatCondition } from "@/lib/utils";

interface ProductImage {
  imageUrl: string;
}

interface Seller {
  id: number;
  name: string;
  createdAt: string;
}

interface Product {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  location: string;
  status: string;
  createdAt: string;
  images: ProductImage[];
  seller: Seller;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      const res = await fetch(`/api/products/${params.id}`);
      if (!res.ok) {
        router.push("/products");
        return;
      }
      try {
        const data = await res.json();
        setProduct(data.product);
      } catch {
        router.push("/products");
        return;
      }
      setLoading(false);
    }
    fetchProduct();
  }, [params.id, router]);

  if (loading || !product) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading...</div>
    );
  }

  const serviceFee = Math.round(product.price * 0.1);
  const total = product.price + serviceFee;
  const isOwner = session?.user?.id === String(product.sellerId);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Images */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
          {product.images[selectedImage] ? (
            <Image
              src={product.images[selectedImage].imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              No image
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                  i === selectedImage
                    ? "border-zinc-900 dark:border-zinc-50"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={img.imageUrl}
                  alt={`Image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {product.title}
        </h1>

        <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {formatPrice(product.price)}
        </p>

        {/* Fee breakdown */}
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>Item price</span>
            <span>{formatPrice(product.price)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>Service fee (10%)</span>
            <span>{formatPrice(serviceFee)}</span>
          </div>
          <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
            <div className="flex justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <span>Total you pay</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Condition</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatCondition(product.condition)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Category</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {product.category}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Location</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {product.location}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Listed</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {new Date(product.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Seller</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {product.seller.name}
            </span>
          </div>
        </div>

        <div className="mt-8">
          {isOwner ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              This is your listing
            </div>
          ) : (
            <button
              onClick={async () => {
                if (!session) {
                  router.push(`/login?callbackUrl=/products/${params.id}`);
                  return;
                }
                setBuying(true);
                try {
                  const res = await fetch("/api/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: product.id }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data.error || "Failed to start checkout");
                    setBuying(false);
                    return;
                  }
                  router.push(`/checkout/${data.transactionId}`);
                } catch {
                  alert("Something went wrong");
                  setBuying(false);
                }
              }}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              disabled={product.status !== "active" || buying}
            >
              {buying
                ? "Starting checkout..."
                : product.status === "active"
                  ? "Buy Now"
                  : "Not Available"}
            </button>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Description
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        </div>
      </div>
    </div>
  );
}
