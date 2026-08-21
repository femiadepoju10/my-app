"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { formatPrice, formatCondition } from "@/lib/utils";
import {
  ArrowLeft, MapPin, Tag, Calendar, User, Shield, CreditCard,
  ShoppingCart, MessageSquare, Edit, Trash2, Loader2, ChevronRight, Package,
  Heart, Share2, Bell, CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Avatar } from "@/components/ui/Avatar";

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
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <button onClick={() => router.push("/products")} className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Marketplace
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-zinc-900 dark:text-zinc-50">{product.title}</span>
      </nav>

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
            <div className="absolute left-3 top-3 flex gap-2">
              <Badge variant={product.condition === "new" ? "success" : "primary"}>
                {formatCondition(product.condition)}
              </Badge>
              {product.status === "sold" && (
                <Badge variant="danger">Sold</Badge>
              )}
            </div>
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                type="button"
                onClick={() => addToast("Added to wishlist", "success")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-400 transition-colors hover:text-red-500 dark:bg-zinc-900/90"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => addToast("Link copied to clipboard", "success")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-400 transition-colors hover:text-indigo-600 dark:bg-zinc-900/90"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
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
          <div className="mb-2 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {product.title}
            </h1>
            <Button variant="outline" size="sm" className="shrink-0">
              <Bell className="h-4 w-4" />
              Notify me
            </Button>
          </div>

          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatPrice(product.price)}
            </p>
            <span className="text-sm text-zinc-500 line-through">
              {formatPrice(total)}
            </span>
          </div>

          <Separator className="my-6" />

          {/* Seller Card */}
          <Card padding="md" className="mb-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={undefined}
                fallback={product.seller.name}
                size="lg"
              />
              <div className="flex-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {product.seller.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Seller · Member since {new Date(product.seller.createdAt).getFullYear()}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                <Shield className="h-3 w-3" />
                Verified
              </div>
            </div>
          </Card>

          {/* Fee Breakdown */}
          <Card padding="none" className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2">
              <p className="text-xs font-medium text-white/80">Cost Breakdown</p>
            </div>
            <div className="p-4">
              <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>Item price</span>
                <span>{formatPrice(product.price)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>Service fee (10%)</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-zinc-50">
                <span>Total you pay</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(total)}</span>
              </div>
            </div>
          </Card>

          {/* Product Details */}
          <Card padding="none" className="mb-6 overflow-hidden">
            <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Product Details</p>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-zinc-500"><Tag className="h-3.5 w-3.5" /> Condition</span>
                <Badge variant={product.condition === "new" ? "success" : "primary"} size="sm">
                  {formatCondition(product.condition)}
                </Badge>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-zinc-500"><Tag className="h-3.5 w-3.5" /> Category</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{product.category}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-zinc-500"><MapPin className="h-3.5 w-3.5" /> Location</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{product.location}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-zinc-500"><Calendar className="h-3.5 w-3.5" /> Listed</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          {/* Trust Badges */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Shield className="h-3.5 w-3.5" />
              Escrow Protected
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
              <CreditCard className="h-3.5 w-3.5" />
              Secure Payment
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
              <CheckCircle className="h-3.5 w-3.5" />
              Buyer Protection
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8">
            {isOwner ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <Package className="h-4 w-4" />
                This is your listing
              </div>
            ) : product.status === "active" ? (
              <Button
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
                isLoading={buying}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="h-4 w-4" />
                {buying ? "Starting checkout..." : "Buy Now"}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                {product.status === "sold" ? "Sold" : product.status === "reserved" ? "Reserved" : "Not Available"}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Description
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Related Products Placeholder */}
      <div className="mt-16">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Related Products</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">You might also be interested in these items</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-900" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 w-1/3 rounded bg-indigo-100 dark:bg-indigo-900/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      {!isOwner && product.status === "active" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/90 p-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 lg:hidden">
          <Button
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
            isLoading={buying}
            className="w-full"
          >
            <ShoppingCart className="h-4 w-4" />
            {buying ? "Starting checkout..." : `Buy Now — ${formatPrice(total)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
