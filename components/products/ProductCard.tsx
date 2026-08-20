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
  images: ProductImage[];
}

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images[0]?.imageUrl;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {product.title}
        </h3>
        <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {formatPrice(product.price)}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{formatCondition(product.condition)}</span>
          <span>{product.location}</span>
        </div>
      </div>
    </Link>
  );
}
