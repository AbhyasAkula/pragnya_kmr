"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { duration, easeLuxe } from "@/config/motion";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types/content";

export type LightboxImage = ImageAsset & { id: string; caption: string };

type LightboxProps = {
  images: LightboxImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
};

/** Full-screen image viewer: Escape closes, arrow keys navigate, focus is trapped. */
export function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const image = images[index];
  const count = images.length;
  const prev = useCallback(() => onIndexChange((index - 1 + count) % count), [index, count, onIndexChange]);
  const next = useCallback(() => onIndexChange((index + 1) % count), [index, count, onIndexChange]);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const control =
    "inline-flex size-12 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-ink";

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Gallery image ${index + 1} of ${count}: ${image.caption}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: duration.fast, ease: easeLuxe }}
      className="fixed inset-0 z-[60] flex flex-col bg-ink/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="container-site flex h-20 shrink-0 items-center justify-between text-mist">
        <p className="text-sm tracking-[0.2em]">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </p>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close gallery" className={control}>
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6 sm:px-20" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={image.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: duration.fast, ease: easeLuxe }}
            className="flex size-full max-w-6xl flex-col"
          >
            <div className="relative flex-1">
              <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-contain" />
            </div>
            <figcaption className="mt-4 text-center font-display text-2xl text-ivory">{image.caption}</figcaption>
          </motion.figure>
        </AnimatePresence>

        <button type="button" onClick={prev} aria-label="Previous image" className={cn(control, "absolute bottom-8 left-4 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2")}>
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button type="button" onClick={next} aria-label="Next image" className={cn(control, "absolute right-4 bottom-8 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2")}>
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}
