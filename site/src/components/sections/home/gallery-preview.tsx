"use client";

import { AnimatePresence } from "motion/react";
import { Expand } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Lightbox } from "@/components/ui/lightbox";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import type { GalleryImage, SectionCopy } from "@/types/content";

/**
 * Bento layout, applied by position. `sizes` mirrors each tile's rendered
 * width so the browser downloads an appropriately sized image
 * (container content max ≈ 1200px: 2 columns ≈ 600px, 1 column ≈ 300px).
 */
const LG_WIDE = "(min-width: 1280px) 600px, (min-width: 1024px) 50vw";
const LG_NARROW = "(min-width: 1280px) 300px, (min-width: 1024px) 25vw";
const layout = [
  { span: "col-span-2 lg:row-span-2", sizes: `${LG_WIDE}, 100vw` },
  { span: "", sizes: `${LG_NARROW}, 50vw` },
  { span: "lg:row-span-2", sizes: `${LG_NARROW}, 50vw` },
  { span: "", sizes: `${LG_NARROW}, 50vw` },
  { span: "lg:col-span-2", sizes: `${LG_WIDE}, 50vw` },
  { span: "col-span-2", sizes: `${LG_WIDE}, 100vw` },
];

type GalleryPreviewProps = SectionCopy & { images: GalleryImage[] };

export function GalleryPreview({ images, ...heading }: GalleryPreviewProps) {
  const [active, setActive] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open = (index: number, el: HTMLButtonElement) => {
    triggerRef.current = el;
    setActive(index);
  };
  const close = useCallback(() => {
    setActive(null);
    triggerRef.current?.focus();
  }, []);

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="section-y">
      <div className="container-site">
        <SectionHeading id="gallery-title" align="center" {...heading} />

        <RevealGroup className="mt-14 grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[15rem] sm:gap-4 lg:mt-20 lg:auto-rows-[16rem] lg:grid-cols-4">
          {images.map((image, index) => {
            const tile = layout[index % layout.length];
            return (
            <RevealItem key={image.id} className={cn("relative", tile.span)}>
              <button
                type="button"
                onClick={(e) => open(index, e.currentTarget)}
                aria-label={`View larger: ${image.caption}`}
                className="group relative block size-full overflow-hidden rounded-2xl"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={tile.sizes}
                  className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/75 via-ink/0 to-transparent p-3 text-left sm:p-5 opacity-100 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100"
                >
                  <span className="truncate font-display text-lg text-ivory sm:text-2xl">{image.caption}</span>
                  <Expand className="size-4 shrink-0 text-ivory sm:size-5" />
                </span>
              </button>
            </RevealItem>
            );
          })}
        </RevealGroup>

        <div className="mt-12 flex justify-center">
          <ButtonLink href="/gallery" variant="outline" size="lg">
            View full gallery
          </ButtonLink>
        </div>
      </div>

      <AnimatePresence>
        {active !== null ? (
          <Lightbox images={images} index={active} onIndexChange={setActive} onClose={close} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
