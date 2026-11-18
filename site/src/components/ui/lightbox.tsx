"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Clapperboard, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { duration, easeLuxe } from "@/config/motion";
import { cn } from "@/lib/utils";
import type { MediaItem, MediaSource } from "@/types/content";
import { MediaBadge } from "./media-badge";

/** Anything the lightbox can show: an image, or a video (with poster in `src`). */
export type LightboxImage = Omit<MediaItem, "source"> & { source?: MediaSource };

type LightboxProps = {
  images: LightboxImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
};

/**
 * Full-screen viewer for photos and videos: Escape closes, arrow keys
 * navigate, focus is trapped. Shows the render/photo label when provided.
 */
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
        const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>("button, video[controls]")].filter(
          (el) => el.offsetParent !== null,
        );
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

  const isVideo = image.kind === "video";
  const control =
    "inline-flex size-12 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-ink";

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Gallery ${isVideo ? "video" : "image"} ${index + 1} of ${count}: ${image.caption}`}
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

      {/* Stage: media on top; caption row below. On phones the prev/next buttons
          sit in the caption row (no overlap); from `sm` they float at the sides. */}
      <div
        className="relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-4 px-4 pb-6 sm:px-20"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={image.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: easeLuxe }}
            className="relative mx-auto size-full max-w-6xl"
          >
            {isVideo && image.video?.src ? (
              <video
                src={image.video.src}
                poster={image.src}
                controls
                playsInline
                preload="metadata"
                className="size-full object-contain"
                aria-label={image.caption}
              />
            ) : (
              <Image src={image.src} alt={image.alt} fill sizes="100vw" className={cn("object-contain", isVideo && "opacity-40")} />
            )}
            {isVideo && !image.video?.src ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-ivory">
                <Clapperboard className="size-10 text-gold-light" strokeWidth={1.25} aria-hidden />
                <p className="mt-4 font-display text-3xl">Video coming soon</p>
                <p className="mt-2 max-w-sm text-sm text-mist">This is a placeholder. The film will appear here once it is published.</p>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={prev} aria-label="Previous" className={cn(control, "shrink-0 sm:absolute sm:top-1/2 sm:left-4 sm:-translate-y-1/2")}>
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <p className="font-display text-xl text-ivory sm:text-2xl">{image.caption}</p>
            {image.source ? <MediaBadge source={image.source} isVideo={isVideo} long /> : null}
          </div>
          <button type="button" onClick={next} aria-label="Next" className={cn(control, "shrink-0 sm:absolute sm:top-1/2 sm:right-4 sm:-translate-y-1/2")}>
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
