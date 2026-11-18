"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { GalleryCategory, GalleryImage } from "@/types/content";
import { MediaGrid } from "./media-grid";

type Filter = "all" | GalleryCategory;

type GalleryBrowserProps = {
  items: GalleryImage[];
  categories: { id: GalleryCategory; label: string }[];
};

/** Category filter + media grid. The lightbox pages through the filtered set. */
export function GalleryBrowser({ items, categories }: GalleryBrowserProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [filter, items],
  );

  const options: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: items.length },
    ...categories.map((c) => ({ id: c.id, label: c.label, count: items.filter((i) => i.category === c.id).length })),
  ];

  return (
    <div>
      <div role="group" aria-label="Filter gallery by category" className="-mx-5 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
        <div className="flex w-max gap-2">
          {options.map((o) => {
            const selected = filter === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(o.id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors duration-300",
                  selected ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-ivory text-ink hover:border-ink",
                )}
              >
                {o.label}
                <span className={cn("text-xs tabular-nums", selected ? "text-mist" : "text-stone")}>{o.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {visible.length} {visible.length === 1 ? "item" : "items"}
      </p>

      {/* Remount on filter change so the lightbox index always matches the visible set. */}
      <MediaGrid
        key={filter}
        items={visible}
        className="mt-8"
        columnsClassName="grid-cols-2 lg:grid-cols-3"
        sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, 50vw"
      />
    </div>
  );
}
