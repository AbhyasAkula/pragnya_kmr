import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Crumb } from "@/lib/seo";

/** Visible breadcrumb trail; the last crumb is the current page. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium tracking-[0.14em] uppercase">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-white">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link href={item.href} className="inline-flex min-h-6 items-center text-white/80 transition-colors hover:text-gold-light">
                    {item.label}
                  </Link>
                  <ChevronRight className="size-3.5 text-white/50" aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
