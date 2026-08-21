"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { formatPrice, formatCondition } from "@/lib/utils";
import {
  ArrowLeft, MapPin, Tag, Calendar, User, Shield, CreditCard,
  ShoppingCart, MessageSquare, Edit, Trash2, Loader2, ChevronRight, Package,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

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
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchProduct() {
      const res = await fetch(`/api/products/${params.id}`);
      if (cancelled) return;
      if (!res.ok) {
        router.push("/products");
        return;
      }
      try {
        const data = await res.json();
        if (!cancelled) {
          setProduct(data.product);
        }
      } catch {
        if (!cancelled) {
          router.push("/products");
        }
        return;
      }
      if (!cancelled) setLoading(false);
    }
    fetchProduct();
    return () => { cancelled = true; };
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center text-zinc-500">Product not found</div>
    );
  }

  const serviceFee = Math.round(product.price * 0.1);
  const total = product.price + serviceFee;
  const isOwner = session?.user?.id === String(product.sellerId);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

    <div className="grid gap-8 lg:grid-cols-2">
      {/* Images */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
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
              <Package className="h-12 w-12" />
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  i === selectedImage
                    ? "border-indigo-600 ring-2 ring-indigo-600/20"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {product.title}
        </h1>

        <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {formatPrice(product.price)}
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <User className="h-4 w-4" />
          Seller: {product.seller.name}
        </div>

        {/* Fee breakdown */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2">
            <p className="text-xs font-medium text-white/80">Cost Breakdown</p>
          </div>
          <div className="bg-zinc-50 p-4 dark:bg-zinc-900">
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Item price</span>
              <span>{formatPrice(product.price)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Service fee (10%)</span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
            <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
              <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-zinc-50">
                <span>Total you pay</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-zinc-500"><Tag className="h-3.5 w-3.5" /> Condition</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatCondition(product.condition)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-zinc-500"><Tag className="h-3.5 w-3.5" /> Category</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{product.category}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-zinc-500"><MapPin className="h-3.5 w-3.5" /> Location</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{product.location}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-zinc-500"><Calendar className="h-3.5 w-3.5" /> Listed</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-8">
          {isOwner ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <Package className="h-4 w-4" />
              This is your listing
            </div>
          ) : product.status === "active" ? (
            <button
              onClick={async () => {
                if (status === "loading") return;
                if (!session?.user) {
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
                    addToast(data.error || "Failed to start checkout", "error");
                    setBuying(false);
                    return;
                  }
                  router.push(`/checkout/${data.transactionId}`);
                } catch {
                  addToast("Something went wrong", "error");
                  setBuying(false);
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:shadow-xl disabled:opacity-50"
              disabled={buying}
            >
              {buying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              {buying ? "Starting checkout..." : "Buy Now"}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              {product.status === "sold" ? "Sold" : product.status === "reserved" ? "Reserved" : "Not Available"}
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Description
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
