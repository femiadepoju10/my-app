import Link from "next/link";
import { Handshake, ShoppingCart, Tag, Shield } from "lucide-react";
import BrandName from "@/components/ui/BrandName";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Handshake className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                <BrandName />
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              A secure marketplace where your payment is protected until you
              confirm receipt of your item.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Marketplace
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/products"
                  className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products/sell"
                  className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                >
                  <Tag className="h-3.5 w-3.5" />
                  Sell an Item
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Account
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-sm text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Trust &amp; Safety
            </h3>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                Escrow protection
              </li>
              <li className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                Secure payments via Paystack
              </li>
              <li className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                Buyer &amp; seller verification
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} <BrandName />. All rights reserved. Built
            for safe, transparent transactions.
          </p>
        </div>
      </div>
    </footer>
  );
}
