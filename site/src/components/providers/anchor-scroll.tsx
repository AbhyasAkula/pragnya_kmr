"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Calm, predictable scrolling for same-page anchor links ("#site-visit",
 * "/#gallery" while on the homepage, the skip link…).
 *
 * Native `scroll-behavior: smooth` lets the browser pick the speed, which
 * makes long jumps whip past the page. Here at most ~900px is ever animated:
 * a far target is approached with an instant cut to just short of it, then a
 * soft ease-in-out glide (≈0.5–0.85s) settles it into place. And:
 *  - any wheel, touch or key input immediately hands control back to the user;
 *  - reduced-motion users get an instant jump;
 *  - focus moves to the target so keyboard and screen-reader users land there;
 *  - the URL hash updates (Back returns to the previous position).
 *  - after navigating to another page's anchor, focus lands on that target too.
 * The offset comes from `scroll-padding-top` in globals.css (fixed header).
 */

/** Longest distance that is animated; anything further is cut, then glided. */
const MAX_GLIDE_PX = 900;
const MIN_MS = 500;
const MAX_MS = 850;
const MS_PER_PX = 0.4;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function focusTarget(target: HTMLElement) {
  if (!target.matches("a[href], button, input, select, textarea, [tabindex]")) {
    target.setAttribute("tabindex", "-1");
  }
  const attempt = () => target.focus({ preventScroll: true });
  // A closing overlay (mobile menu) may still have the page marked inert.
  if (target.closest("[inert]")) window.setTimeout(attempt, 400);
  else attempt();
}

export function AnchorScroll() {
  const pathname = usePathname();

  // Cross-page links such as "/#site-visit": Next.js scrolls to the anchor;
  // move focus there as well so keyboard users continue from the target.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (target) focusTarget(target);
  }, [pathname]);

  useEffect(() => {
    let frame = 0;
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const scrollToTarget = (target: HTMLElement) => {
      stop();
      const root = document.documentElement;
      const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      const maxY = root.scrollHeight - window.innerHeight;
      const end = Math.max(0, Math.min(target.getBoundingClientRect().top + window.scrollY - offset, maxY));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduce || Math.abs(end - window.scrollY) < 2) {
        window.scrollTo(0, end);
        focusTarget(target);
        return;
      }

      // Far away? Cut to just short of the target so only a short glide is seen.
      if (Math.abs(end - window.scrollY) > MAX_GLIDE_PX) {
        window.scrollTo(0, end - Math.sign(end - window.scrollY) * MAX_GLIDE_PX);
      }
      const start = window.scrollY;
      const distance = end - start;
      const duration = Math.min(MAX_MS, MIN_MS + Math.abs(distance) * MS_PER_PX);
      const t0 = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - t0) / duration);
        window.scrollTo(0, start + distance * easeInOutCubic(progress));
        if (progress < 1) frame = requestAnimationFrame(step);
        else {
          frame = 0;
          focusTarget(target);
        }
      };
      frame = requestAnimationFrame(step);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      const here = window.location;
      if (!url.hash || url.origin !== here.origin || url.pathname !== here.pathname || url.search !== here.search) {
        return; // different page: let Next.js navigate normally
      }
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      event.preventDefault(); // Next.js <Link> skips its own handling when prevented
      if (here.hash !== url.hash) window.history.pushState(null, "", url.hash);
      scrollToTarget(target);
    };

    // User input always wins over an in-progress animated scroll.
    const interrupt = () => stop();
    document.addEventListener("click", onClick, true);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", interrupt);
    return () => {
      stop();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("keydown", interrupt);
    };
  }, []);

  return null;
}
