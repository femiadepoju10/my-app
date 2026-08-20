"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { CATEGORIES, CONDITIONS } from "@/lib/utils";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      const res = await fetch(`/api/products/${params.id}`);
      if (!res.ok) {
        router.push("/dashboard/listings");
        return;
      }
      const data = await res.json();
      const p = data.product;
      setImages(p.images.map((img: { imageUrl: string }) => img.imageUrl));
      const form = document.getElementById("edit-form") as HTMLFormElement;
      if (form) {
        (form.elements.namedItem("title") as HTMLInputElement).value = p.title;
        (form.elements.namedItem("description") as HTMLTextAreaElement).value =
          p.description;
        (form.elements.namedItem("category") as HTMLSelectElement).value =
          p.category;
        (form.elements.namedItem("condition") as HTMLSelectElement).value =
          p.condition;
        (form.elements.namedItem("price") as HTMLInputElement).value = String(
          p.price / 100
        );
        (form.elements.namedItem("location") as HTMLInputElement).value =
          p.location;
      }
      setLoading(false);
    }
    fetchProduct();
  }, [params.id, router]);

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
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    const body = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      condition: formData.get("condition"),
      price: Math.round(parseFloat(formData.get("price") as string) * 100) || 0,
      location: formData.get("location"),
      images,
    };

    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
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

      router.push("/dashboard/listings");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">Loading...</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Edit Listing
      </h1>

      <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
        {serverError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {serverError}
          </div>
        )}

        {/* Images */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Product Images (up to 5)
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative h-24 w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Upload ${i + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                >
                  x
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-xs text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-600">
                {uploading ? "Uploading..." : "+ Add"}
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

        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Title
          </label>
          <input id="title" name="title" type="text" required className={inputClass} />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className={inputClass}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description[0]}</p>
          )}
        </div>

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
          </div>

          <div>
            <label
              htmlFor="condition"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Condition
            </label>
            <select id="condition" name="condition" required className={inputClass}>
              <option value="">Select condition</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="price"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Price (NGN)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="1"
              required
              className={inputClass}
            />
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
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
