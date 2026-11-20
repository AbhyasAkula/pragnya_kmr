import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Aurelia Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Admin pages read the session on every request, so they are allowed to
 * block (no static shell); the public site stays fully prerendered.
 */
export const instant = false;

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-canvas text-ink">{children}</div>;
}
