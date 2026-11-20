import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

/** Centered card for sign-in, password reset and invitation pages. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_24px_48px_-32px_rgba(28,25,23,0.35)] sm:p-8">
        {children}
      </div>
      <p className="mt-6 text-center text-xs text-stone">Staff access only. Activity is logged.</p>
    </main>
  );
}
