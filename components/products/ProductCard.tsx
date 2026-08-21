import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
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
  images: ProductImage[];
}

const conditionColors: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  like_new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  good: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  fair: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  used: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images[0]?.imageUrl;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-950"
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
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${conditionColors[product.condition] || conditionColors.used}`}
          >
            {formatCondition(product.condition)}
          </span>
        </div>
        {product.status === "sold" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 shadow-lg">
              Sold
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
          {product.title}
        </h3>
        <p className="mt-1.5 text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {formatPrice(product.price)}
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
          <MapPin className="h-3 w-3" />
          {product.location}
        </div>
      </div>
    </Link>
  );
}
