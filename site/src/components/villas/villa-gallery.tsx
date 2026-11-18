"use client";

import { AnimatePresence } from "motion/react";
import { Expand } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Lightbox, type LightboxImage } from "@/components/ui/lightbox";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Villa image gallery: a lead image plus a grid, each opening the shared
 * Lightbox. `sizes` mirrors rendered widths (content max ≈ 1200px).
 */
export function VillaGallery({ images, villaName }: { images: LightboxImage[]; villaName: string }) {
  const [active, setActive] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setActive(null);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <RevealGroup className="grid auto-rows-[12rem] grid-cols-2 gap-3 sm:auto-rows-[14rem] sm:gap-4 lg:auto-rows-[15rem] lg:grid-cols-4">
        {images.map((image, index) => {
          const lead = index === 0;
          return (
            <RevealItem key={image.id} className={cn("relative", lead && "col-span-2 row-span-2")}>
              <button
                type="button"
                onClick={(e) => {
                  triggerRef.current = e.currentTarget;
                  setActive(index);
                }}
                aria-label={`View larger: ${villaName}, ${image.caption}`}
                className="group relative block size-full overflow-hidden rounded-2xl"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={
                    lead
                      ? "(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
                      : "(min-width: 1280px) 300px, (min-width: 1024px) 25vw, 50vw"
                  }
                  className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/75 via-ink/0 to-transparent p-3 text-left sm:p-5"
                >
                  <span className="truncate font-display text-lg text-ivory sm:text-2xl">{image.caption}</span>
                  <Expand className="size-4 shrink-0 text-ivory sm:size-5" />
                </span>
              </button>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <AnimatePresence>
        {active !== null ? (
          <Lightbox images={images} index={active} onIndexChange={setActive} onClose={close} />
        ) : null}
      </AnimatePresence>
    </>
  );
}
