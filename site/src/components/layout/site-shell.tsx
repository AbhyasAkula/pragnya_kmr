import type { ReactNode } from "react";
import { jsonLdString } from "@/lib/seo";
import { Footer } from "./footer";
import { Navbar } from "./navbar";

/** Page chrome for interior pages: navbar, <main id="main"> (skip-link target), footer. */
export function SiteShell({ children, jsonLd = [] }: { children: ReactNode; jsonLd?: unknown[] }) {
  return (
    <>
      {jsonLd.filter(Boolean).map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
      ))}
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
