"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, Handshake, ArrowRight } from "lucide-react";
import BrandName from "@/components/ui/BrandName";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const body = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    try {
      const res = await fetch("/api/auth/signup", {
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

      router.push("/login?registered=true");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-8 text-center lg:hidden">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Handshake className="h-6 w-6" />
        </div>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create an account
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Join <BrandName /> to buy and sell with confidence
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none"
      >
      {serverError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <span className="text-red-500">!</span>
          {serverError}
        </div>
      )}

      {(errors.general?.[0] || errors.name?.[0] || errors.email?.[0] || errors.phone?.[0] || errors.password?.[0] || errors.confirmPassword?.[0]) && !serverError && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {errors.general?.[0] || errors.name?.[0] || errors.email?.[0] || errors.phone?.[0] || errors.password?.[0] || errors.confirmPassword?.[0]}
        </div>
      )}

        <Input
          label="Full name"
          type="text"
          id="name"
          name="name"
          required
          placeholder="John Doe"
          icon={<User className="h-4 w-4" />}
          error={errors.name?.[0]}
        />

        <Input
          label="Email"
          type="email"
          id="email"
          name="email"
          required
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.[0]}
        />

        <Input
          label="Phone number"
          type="tel"
          id="phone"
          name="phone"
          required
          placeholder="08012345678"
          icon={<Phone className="h-4 w-4" />}
          error={errors.phone?.[0]}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            required
            placeholder="At least 8 characters"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.[0]}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            style={{ position: 'relative', float: 'right', marginTop: '-32px', marginRight: '8px' }}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div>
          <Input
            label="Confirm password"
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            required
            placeholder="Re-enter password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.[0]}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            style={{ position: 'relative', float: 'right', marginTop: '-32px', marginRight: '8px' }}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          className="w-full"
        >
          <UserPlus className="h-4 w-4" />
          Sign up
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Log in
          <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}
