"use client";

import { AnimatePresence } from "motion/react";
import { Expand, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Lightbox, type LightboxImage } from "@/components/ui/lightbox";
import { MediaBadge } from "@/components/ui/media-badge";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

type MediaGridProps = {
  items: LightboxImage[];
  /** Tailwind grid-cols classes for the layout. */
  columnsClassName?: string;
  /** `sizes` hint matching the grid's column widths. */
  sizes?: string;
  className?: string;
};

/**
 * Uniform grid of photos/videos that open the shared Lightbox.
 * Every tile shows whether it is a render or a photograph.
 */
export function MediaGrid({
  items,
  columnsClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  sizes = "(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
}: MediaGridProps) {
  const [active, setActive] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => {
    setActive(null);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <RevealGroup className={cn("grid gap-3 sm:gap-5", columnsClassName, className)}>
        {items.map((item, index) => {
          const isVideo = item.kind === "video";
          const typeLabel = isVideo ? "video" : item.source === "render" ? "render" : "photograph";
          return (
            <RevealItem key={item.id}>
              <button
                type="button"
                onClick={(e) => {
                  triggerRef.current = e.currentTarget;
                  setActive(index);
                }}
                aria-label={`Open ${item.caption} (${typeLabel})`}
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sand"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes={sizes}
                  className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
                />
                {item.source ? (
                  <MediaBadge source={item.source} isVideo={isVideo} className="absolute top-2 left-2 sm:top-3 sm:left-3" />
                ) : null}
                {isVideo ? (
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex size-11 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-lg transition-transform duration-500 ease-calm group-hover:scale-105 sm:size-14">
                      <Play className="ml-0.5 size-5" fill="currentColor" />
                    </span>
                  </span>
                ) : null}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/80 to-transparent p-3 pt-10 text-left sm:p-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-display text-base text-ivory sm:text-xl">{item.caption}</span>
                    {isVideo && !item.video?.src ? (
                      <span className="mt-0.5 block text-xs text-mist">Coming soon</span>
                    ) : null}
                  </span>
                  <Expand className="hidden size-4 shrink-0 text-ivory sm:block" />
                </span>
              </button>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <AnimatePresence>
        {active !== null ? <Lightbox images={items} index={active} onIndexChange={setActive} onClose={close} /> : null}
      </AnimatePresence>
    </>
  );
}
