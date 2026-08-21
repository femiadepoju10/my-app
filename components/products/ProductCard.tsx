import Link from "next/link";
import Image from "next/image";
import { MapPin, Heart } from "lucide-react";
import { formatPrice, formatCondition } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

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
  images: ProductImage[];
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
        </div>
        {product.status === "sold" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 shadow-lg">
              Sold
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-400 opacity-0 transition-all duration-200 hover:text-red-500 group-hover:opacity-100 dark:bg-zinc-900/90"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
          {product.title}
        </h3>
        <p className="mt-1.5 text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {formatPrice(product.price)}
        </p>
        <div className="mt-auto flex items-center gap-1 pt-2 text-xs text-zinc-400">
          <MapPin className="h-3 w-3" />
          {product.location}
        </div>
      </div>
    </Link>
  );
}
