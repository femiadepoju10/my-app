"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CONDITIONS, getCurrencySymbol } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { Tag, Camera, Upload, X, Loader2, Info, Sparkles, Rocket } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SellPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("NGN");
  const [description, setDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [boosting, setBoosting] = useState(false);
  const [boostDuration, setBoostDuration] = useState(3);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 5) {
      setErrors({ images: ["Maximum 5 images allowed"] });
      return;
    }

    setUploading(true);
    setErrors({});

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ images: ["Each image must be under 5MB"] });
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setErrors({ images: [data.error || "Upload failed"] });
          setUploading(false);
          return;
        }

        setImages((prev) => [...prev, data.url]);
      } catch {
        setErrors({ images: ["Upload failed"] });
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const body = {
      title: formData.get("title"),
      description: description,
      category: formData.get("category"),
      condition: formData.get("condition"),
      price: Math.round(parseFloat(formData.get("price") as string) * 100) || 0,
      currency: formData.get("currency") as string,
      location: formData.get("location"),
      images,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

       const data = await res.json();

       if (!res.ok) {
         if (data.error && typeof data.error === "object") {
           setErrors(data.error);
         } else {
           setServerError(data.error || "Something went wrong");
         }
         return;
       }

       setCreatedProductId(data.product.id);
     } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <Tag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sell an Item
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">List your product on the marketplace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {serverError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <span className="text-red-500">!</span>
            {serverError}
          </div>
        )}

        {/* Images */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Camera className="h-4 w-4" />
            Product Images (up to 5)
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative h-24 w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Upload ${i + 1}`}
                  className="h-full w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-xs text-zinc-400 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-zinc-700 dark:hover:border-indigo-600">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="mt-1">{uploading ? "Uploading..." : "Add"}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {errors.images && (
            <p className="mt-1 text-xs text-red-600">{errors.images[0]}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className={inputClass}
            placeholder="e.g. iPhone 15 Pro Max"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title[0]}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Description
            </label>
            {images.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  setAiGenerating(true);
                  try {
                    const res = await fetch("/api/ai/generate-description", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ imageUrls: images }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.description) {
                        setDescription(data.description);
                        addToast("Description generated successfully", "success");
                      }
                    } else {
                      const data = await res.json();
                      addToast(data.error || "Failed to generate description", "error");
                    }
                  } catch {
                    addToast("Failed to generate description", "error");
                  } finally {
                    setAiGenerating(false);
                  }
                }}
                disabled={aiGenerating}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {aiGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {aiGenerating ? "Generating..." : "Generate with AI"}
              </button>
            )}
          </div>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className={inputClass}
            placeholder="Describe your item in detail"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">
              {errors.description[0]}
            </p>
          )}
        </div>

        {/* Category + Condition */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Category
            </label>
            <select id="category" name="category" required className={inputClass}>
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600">{errors.category[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="condition"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Condition
            </label>
            <select
              id="condition"
              name="condition"
              required
              className={inputClass}
            >
              <option value="">Select condition</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.condition && (
              <p className="mt-1 text-xs text-red-600">
                {errors.condition[0]}
              </p>
            )}
          </div>
         </div>

        {/* Currency */}
        <div>
          <label
            htmlFor="currency"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputClass}
            required
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Price + Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="price"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Price ({getCurrencySymbol(currency)})
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="1"
              required
              value={price || ""}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className={inputClass}
              placeholder="e.g. 500000"
            />
            {errors.price && (
              <p className="mt-1 text-xs text-red-600">{errors.price[0]}</p>
            )}

            {/* Live Fee Calculator */}
            {price > 0 && (
              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5">
                  <Info className="h-3 w-3 text-white/80" />
                  <p className="text-xs font-medium text-white/90">Pricing Preview</p>
                </div>
                <div className="bg-zinc-50 p-3 dark:bg-zinc-900">
                  <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Your listing price</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {getCurrencySymbol(currency)}{(price).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Platform fee (10%)</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {getCurrencySymbol(currency)}{Math.round(price * 0.1).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                      <div className="flex justify-between text-xs font-bold text-zinc-900 dark:text-zinc-50">
                        <span>Buyer pays</span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {getCurrencySymbol(currency)}{(price + Math.round(price * 0.1)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              className={inputClass}
              placeholder="e.g. Lagos, Nigeria"
            />
            {errors.location && (
              <p className="mt-1 text-xs text-red-600">
                {errors.location[0]}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Tag className="h-4 w-4" />
          )}
          {loading ? "Publishing..." : "Publish Listing"}
        </button>
      </form>

      {createdProductId && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-900/30 dark:bg-indigo-900/10">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Rocket className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Boost Your Listing
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Promote your product to the top of search results. Gets 5x more views.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="duration"
                    value="3"
                    checked={boostDuration === 3}
                    onChange={() => setBoostDuration(3)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">3 Days — ₦1,500</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="duration"
                    value="7"
                    checked={boostDuration === 7}
                    onChange={() => setBoostDuration(7)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">7 Days — ₦3,500</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="duration"
                    value="14"
                    checked={boostDuration === 14}
                    onChange={() => setBoostDuration(14)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">14 Days — ₦7,000</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="duration"
                    value="1"
                    checked={boostDuration === 1}
                    onChange={() => setBoostDuration(1)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">1 Day — ₦500</span>
                </label>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setBoosting(true);
                    try {
                      const res = await fetch("/api/sponsored-listings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          productId: createdProductId,
                          durationDays: boostDuration,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok && data.authorization_url) {
                        window.location.href = data.authorization_url;
                      } else {
                        addToast(data.error || "Failed to create sponsored listing", "error");
                      }
                    } catch {
                      addToast("Failed to create sponsored listing", "error");
                    } finally {
                      setBoosting(false);
                    }
                  }}
                  disabled={boosting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {boosting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {boosting ? "Redirecting..." : "Boost Now"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/sponsored")}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Do it later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
