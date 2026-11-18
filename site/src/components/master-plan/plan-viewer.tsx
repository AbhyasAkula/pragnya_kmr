"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const MIN = 1;
const MAX = 4;
const STEP = 0.5;
const PAN_STEP = 80;

type Point = { x: number; y: number };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type PlanViewerProps = {
  /** Accessible name of the zoomable region. */
  label: string;
  /** CSS aspect ratio of the viewport, e.g. "3 / 2". */
  aspectRatio: string;
  children: ReactNode;
};

/**
 * Zoomable / pannable viewer. Every gesture has a single-pointer and
 * keyboard alternative (WCAG 2.5.7): zoom & pan buttons, plus + / − / 0 /
 * arrow keys when the viewport is focused. Ctrl/⌘ + wheel (and trackpad
 * pinch) zooms; plain wheel scrolling is never hijacked.
 */
export function PlanViewer({ label, aspectRatio, children }: PlanViewerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const hintId = useId();

  /** Keeps the content edge-to-edge: you can never pan past the drawing. */
  const clampOffset = useCallback((next: Point, s: number): Point => {
    const el = viewportRef.current;
    if (!el) return next;
    const maxX = ((s - 1) * el.clientWidth) / 2;
    const maxY = ((s - 1) * el.clientHeight) / 2;
    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, []);

  const zoomTo = useCallback(
    (target: number) => {
      const s = clamp(Math.round(target * 100) / 100, MIN, MAX);
      setScale(s);
      setOffset((o) => clampOffset({ x: (o.x * s) / scale, y: (o.y * s) / scale }, s));
    },
    [clampOffset, scale],
  );

  const pan = useCallback(
    (dx: number, dy: number) => setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }, scale)),
    [clampOffset, scale],
  );

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Ctrl/⌘ + wheel or trackpad pinch → zoom. Needs a non-passive listener.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomTo(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scale, zoomTo]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Re-clamp when the viewport size changes (rotation, fullscreen).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setOffset((o) => clampOffset(o, scale)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [clampOffset, scale]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frameRef.current?.requestFullscreen();
    } catch {
      /* Fullscreen unavailable (e.g. iOS Safari) — the inline viewer still works. */
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale };
    }
    if (scale > 1 || pointers.current.size === 2) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const current = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, current);

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomTo((pinchStart.current.scale * distance) / pinchStart.current.distance);
    } else if (pointers.current.size === 1 && scale > 1) {
      pan(current.x - prev.x, current.y - prev.y);
    }
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const actions: Record<string, () => void> = {
      "+": () => zoomTo(scale + STEP),
      "=": () => zoomTo(scale + STEP),
      "-": () => zoomTo(scale - STEP),
      "_": () => zoomTo(scale - STEP),
      "0": reset,
      ArrowLeft: () => pan(PAN_STEP, 0),
      ArrowRight: () => pan(-PAN_STEP, 0),
      ArrowUp: () => pan(0, PAN_STEP),
      ArrowDown: () => pan(0, -PAN_STEP),
    };
    const action = actions[e.key];
    // Arrow keys only pan when zoomed; otherwise let the page scroll.
    if (!action || (e.key.startsWith("Arrow") && scale === 1)) return;
    e.preventDefault();
    action();
  };

  const zoomed = scale > 1;
  const control =
    "inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink hover:text-ivory disabled:pointer-events-none disabled:opacity-35";

  return (
    <div
      ref={frameRef}
      className={cn(fullscreen && "flex h-full flex-col bg-ink p-4 sm:p-6")}
    >
      {/* Positioning context for the overlay controls: viewport only, not the hint text. */}
      <div className={cn("relative", fullscreen && "flex flex-1 flex-col")}>
        <div
          ref={viewportRef}
          role="group"
          aria-roledescription="zoomable image"
          aria-label={label}
          aria-describedby={hintId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onDoubleClick={() => (zoomed ? reset() : zoomTo(2))}
          style={{ aspectRatio: fullscreen ? undefined : aspectRatio, touchAction: zoomed ? "none" : "pan-y" }}
          className={cn(
            "relative w-full overflow-hidden rounded-[1.75rem] border border-line bg-sand select-none focus-visible:outline-offset-4",
            fullscreen && "flex-1 rounded-2xl",
            zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
          )}
        >
          <div
            className={cn("size-full origin-center will-change-transform", !dragging && "transition-transform duration-300 ease-luxe")}
            style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }}
          >
            {children}
          </div>
        </div>

        {/* Controls — single-pointer alternatives to drag/pinch */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-wrap items-end justify-between gap-3 px-4 sm:bottom-5 sm:px-5">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-ivory/95 p-1 shadow-lg backdrop-blur">
            <button type="button" className={control} onClick={() => zoomTo(scale - STEP)} disabled={scale <= MIN} aria-label="Zoom out">
              <ZoomOut className="size-5" aria-hidden />
            </button>
            <output aria-live="polite" className="min-w-14 text-center text-xs font-semibold text-ink tabular-nums">
              {Math.round(scale * 100)}%
            </output>
            <button type="button" className={control} onClick={() => zoomTo(scale + STEP)} disabled={scale >= MAX} aria-label="Zoom in">
              <ZoomIn className="size-5" aria-hidden />
            </button>
            <button type="button" className={control} onClick={reset} disabled={!zoomed} aria-label="Reset view">
              <RotateCcw className="size-[18px]" aria-hidden />
            </button>
            <button
              type="button"
              className={cn(control, "hidden sm:inline-flex")}
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit full screen" : "View full screen"}
            >
              {fullscreen ? <Minimize2 className="size-[18px]" aria-hidden /> : <Maximize2 className="size-[18px]" aria-hidden />}
            </button>
          </div>

          {zoomed ? (
            <div className="pointer-events-auto grid grid-cols-3 gap-0.5 rounded-2xl bg-ivory/95 p-1 shadow-lg backdrop-blur" aria-label="Pan" role="group">
              <span />
              <button type="button" className={control} onClick={() => pan(0, PAN_STEP)} aria-label="Pan up">
                <ArrowUp className="size-4" aria-hidden />
              </button>
              <span />
              <button type="button" className={control} onClick={() => pan(PAN_STEP, 0)} aria-label="Pan left">
                <ArrowLeft className="size-4" aria-hidden />
              </button>
              <span />
              <button type="button" className={control} onClick={() => pan(-PAN_STEP, 0)} aria-label="Pan right">
                <ArrowRight className="size-4" aria-hidden />
              </button>
              <span />
              <button type="button" className={control} onClick={() => pan(0, -PAN_STEP)} aria-label="Pan down">
                <ArrowDown className="size-4" aria-hidden />
              </button>
              <span />
            </div>
          ) : null}
        </div>
      </div>

      <p id={hintId} className={cn("mt-4 text-xs text-stone", fullscreen && "text-mist")}>
        Use the zoom buttons, double-click, or pinch to zoom; drag or use the arrow buttons to move around. With the plan
        focused, press + / − to zoom, arrow keys to pan and 0 to reset.
      </p>
    </div>
  );
}
