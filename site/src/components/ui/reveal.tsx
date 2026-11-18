"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { maxStaggerDelay, stagger as defaultStagger } from "@/config/motion";

/**
 * Scroll reveals, progressively enhanced.
 *
 * Content is server-rendered fully visible. The pre-paint script in the root
 * layout adds `.js` to <html>; only then does CSS (globals.css, "Reveal")
 * hold `[data-reveal]` elements in their start state until this component
 * marks them `data-revealed`. Without JavaScript nothing is ever hidden.
 */

/** Reveal slightly before an element is fully in view, so nothing feels held back. */
const ROOT_MARGIN = "0px 0px -6% 0px";

function useRevealOnce(onReveal?: (el: HTMLElement) => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => {
      onReveal?.(el);
      el.dataset.revealed = "";
    };
    if (typeof IntersectionObserver === "undefined") return reveal();

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onReveal]);

  return ref;
}

type BaseProps = { children: ReactNode; className?: string };

/** Fades + lifts a single block into view once. */
export function Reveal({ children, className, delay = 0 }: BaseProps & { delay?: number }) {
  const ref = useRevealOnce();
  const style = delay ? ({ "--reveal-delay": `${delay}s` } as CSSProperties) : undefined;
  return (
    <div ref={ref} data-reveal="" className={className} style={style}>
      {children}
    </div>
  );
}

/** Parent that staggers its <RevealItem> descendants in DOM order (delay capped). */
export function RevealGroup({
  children,
  className,
  stagger = defaultStagger,
}: BaseProps & { stagger?: number }) {
  // Assign each item its delay just before the group is revealed.
  const assignDelays = useCallback(
    (el: HTMLElement) => {
      el.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((item, i) => {
        const delay = Math.min(i * stagger, maxStaggerDelay);
        item.style.setProperty("--reveal-delay", `${delay}s`);
      });
    },
    [stagger],
  );
  const ref = useRevealOnce(assignDelays);
  return (
    <div ref={ref} data-reveal-group="" className={className}>
      {children}
    </div>
  );
}

/**
 * Item inside a <RevealGroup>. Keep hover/transition utilities on an inner
 * element: the reveal owns this element's `transition` property.
 */
export function RevealItem({ children, className }: BaseProps) {
  return (
    <div data-reveal-item="" className={className}>
      {children}
    </div>
  );
}
