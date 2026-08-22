import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Sparkles } from "lucide-react";
import { formatPrice, formatCondition } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

interface ProductImage {
  imageUrl: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  currency?: string;
  condition: string;
  location: string;
  status: string;
  images: ProductImage[];
  seller?: { id: string; name: string };
  sellerRating?: { average: number; count: number };
  isSponsored?: boolean;
}

const conditionVariantMap: Record<string, "success" | "primary" | "warning" | "default"> = {
  new: "success",
  like_new: "primary",
  good: "primary",
  fair: "warning",
  used: "default",
};

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images[0]?.imageUrl;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No image
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={conditionVariantMap[product.condition] || "default"}>
            {formatCondition(product.condition)}
          </Badge>
          {product.isSponsored && (
            <Badge variant="warning" className="ml-1.5 mt-1">
              <Sparkles className="h-3 w-3 mr-0.5" />
              Sponsored
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} size="sm" />
        </div>
        {product.status === "sold" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 shadow-lg">
              Sold
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
          {product.title}
        </h3>
        <p className="mt-1.5 text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {formatPrice(product.price, product.currency)}
        </p>
        {product.sellerRating && product.sellerRating.count > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {product.sellerRating.average} ({product.sellerRating.count})
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
          <MapPin className="h-3 w-3" />
          {product.location}
        </div>
      </div>
    </Link>
  );
}
