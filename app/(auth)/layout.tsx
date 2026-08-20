import { Handshake, ShieldCheck, CreditCard, PackageCheck } from "lucide-react";
import BrandName from "@/components/ui/BrandName";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 lg:flex">
        <div className="max-w-md px-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Handshake className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Welcome to <BrandName className="text-white" />
          </h2>
          <p className="mt-3 text-lg text-white/80">
            A secure marketplace where your payment is protected until you
            confirm receipt.
          </p>
          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Escrow Protection</p>
                <p className="text-xs text-white/70">Funds held safely until delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Secure Payments</p>
                <p className="text-xs text-white/70">Powered by Paystack</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <PackageCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Buyer Verification</p>
                <p className="text-xs text-white/70">Inspect before you confirm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        {children}
      </div>
    </div>
  );
}
