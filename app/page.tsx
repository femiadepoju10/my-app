import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-white dark:bg-zinc-950">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Buy and sell with{" "}
          <span className="text-emerald-600">confidence</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Your payment is protected until you confirm that you received the item
          as expected. No risks, no worries.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/products"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Browse Products
          </Link>
          <Link
            href="/products/sell"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sell an Item
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                List or Browse
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Sellers list products with photos and prices. Buyers browse and
                find what they need.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Pay Securely
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                The buyer pays through the platform. Funds are held safely until
                the item is received.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Confirm &amp; Complete
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                The buyer inspects the item and confirms acceptance. The seller
                gets paid. Done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service fee disclosure */}
      <section className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            A <strong>10% service fee</strong> is included in every transaction.
            No hidden charges. You always know exactly what you pay.
          </p>
          <div className="mx-auto mt-8 max-w-md rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Item price</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                ₦100,000
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Service fee (10%)</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                ₦10,000
              </span>
            </div>
            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <div className="flex justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                <span>Total</span>
                <span>₦110,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
