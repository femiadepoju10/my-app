"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, CONDITIONS } from "@/lib/utils";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Tag } from "lucide-react";

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
  images: ProductImage[];
  seller?: { id: string; name: string };
}

interface ProductsResponse {
  products: Product[];
  total: number;
  resultsCount: number;
  page: number;
  totalPages: number;
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [resultsCount, setResultsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (condition) params.set("condition", condition);
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, category, sort, page, minPrice, maxPrice, condition, router]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      params.set("sort", sort);
      params.set("page", String(page));
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (condition) params.set("condition", condition);

      const res = await fetch(`/api/products?${params}`);
      if (cancelled) return;
      if (res.ok) {
        const data: ProductsResponse = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setResultsCount(data.resultsCount || 0);
      }
      setLoading(false);
      updateURL();
    }
    fetchProducts();
    return () => { cancelled = true; };
  }, [search, category, sort, page, minPrice, maxPrice, condition, updateURL]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function handlePriceFilter() {
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setSort("newest");
    setPage(1);
    setMinPrice("");
    setMaxPrice("");
    setCondition("");
  }

  const hasActiveFilters = search || category || sort !== "newest" || minPrice || maxPrice || condition;

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (search) activeFilters.push({ label: `"${search}"`, onRemove: () => setSearch("") });
  if (category) activeFilters.push({ label: category, onRemove: () => setCategory("") });
  if (condition) activeFilters.push({ label: CONDITIONS.find((c) => c.value === condition)?.label || condition, onRemove: () => setCondition("") });
  if (minPrice) activeFilters.push({ label: `Min ₦${minPrice}`, onRemove: () => setMinPrice("") });
  if (maxPrice) activeFilters.push({ label: `Max ₦${maxPrice}`, onRemove: () => setMaxPrice("") });

  const selectClass =
    "rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Tag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Marketplace
        </h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <Button type="submit">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className={selectClass}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={condition}
            onChange={(e) => { setCondition(e.target.value); setPage(1); }}
            className={selectClass}
          >
            <option value="">All Conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className={selectClass}
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={handlePriceFilter}
              placeholder="Min"
              min="0"
              className="w-24 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            />
            <span className="text-zinc-400">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={handlePriceFilter}
              placeholder="Max"
              min="0"
              className="w-24 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            />
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilters.map((f, i) => (
              <Badge key={i} variant="primary" size="sm" className="gap-1 pr-1">
                <button onClick={f.onRemove} className="flex items-center gap-1">
                  {f.label}
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Clear all
            </button>
          </div>
        )}
      </Card>

      {/* Results count */}
      {!loading && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          {resultsCount} {resultsCount === 1 ? "result" : "results"} found
        </p>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="search"
          title={hasActiveFilters ? "No products match your filters" : "No products yet"}
          description={hasActiveFilters
            ? "Try adjusting your filters or search terms to find what you're looking for."
            : "Be the first to list an item on the marketplace."}
          action={hasActiveFilters ? (
            <Button onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button href="/products/sell">
              Sell an item
            </Button>
          )}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
