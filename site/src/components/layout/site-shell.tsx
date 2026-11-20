import type { ReactNode } from "react";
import { getContactDetails } from "@/lib/data";
import { jsonLdString } from "@/lib/seo";
import { Footer } from "./footer";
import { Navbar } from "./navbar";

/** Page chrome for interior pages: navbar, <main id="main"> (skip-link target), footer. */
export async function SiteShell({ children, jsonLd = [] }: { children: ReactNode; jsonLd?: unknown[] }) {
  const contact = await getContactDetails();
  return (
    <>
      {jsonLd.filter(Boolean).map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
      ))}
      <Navbar contact={contact} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
