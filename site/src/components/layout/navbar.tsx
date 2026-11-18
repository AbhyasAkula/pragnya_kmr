"use client";

import { AnimatePresence, motion } from "motion/react";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { duration, easeCalm } from "@/config/motion";
import { isCurrentPath, mainNav, primaryCta } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const MENU_ID = "mobile-menu";

/** Mobile menu adds an explicit "Home" link; on desktop the logo serves that role. */
const mobileNav = [{ label: "Home", href: "/" }, ...mainNav];

/**
 * Site header. Always visible (it never slides away on scroll), so the
 * navigation is in the same place on every page and at every scroll depth.
 * Over the dark hero it is transparent; once the page scrolls it gains a
 * frosted ivory background for legibility.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update(); // correct state when a page loads mid-scroll (e.g. /#site-visit)
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  /** `restoreFocus` is false after following a menu link, so focus follows the anchor target. */
  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  const solid = scrolled || open;

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-500 ease-calm",
          solid && !open
            ? "border-b border-line/80 bg-ivory/85 shadow-[0_8px_30px_-20px_rgba(28,25,23,0.35)] backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className="container-site flex h-20 items-center justify-between gap-6"
        >
          <Logo tone={solid && !open ? "light" : "dark"} />

          <ul className="hidden items-center gap-9 lg:flex">
            {mainNav.map((item) => {
              const current = isCurrentPath(item.href, pathname);
              return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-[0.8125rem] font-medium tracking-[0.14em] uppercase transition-colors duration-300",
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-luxe hover:after:scale-x-100",
                    solid ? "text-ink hover:text-gold" : "text-white/90 hover:text-white",
                    current && "after:scale-x-100",
                    current && (solid ? "text-gold" : "text-white"),
                  )}
                >
                  {item.label}
                </Link>
              </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <ButtonLink
              href={primaryCta.href}
              variant={solid ? "dark" : "gold"}
              className="hidden sm:inline-flex"
            >
              {primaryCta.label}
            </ButtonLink>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => (open ? close(false) : setOpen(true))}
              aria-expanded={open}
              aria-controls={MENU_ID}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-xs font-semibold tracking-[0.16em] uppercase transition-colors lg:hidden",
                open
                  ? "border-white/30 text-white"
                  : solid
                    ? "border-ink/20 text-ink"
                    : "border-white/40 text-white",
              )}
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              {/* Visible text label (also the accessible name) — clearer than an icon alone. */}
              <span>{open ? "Close" : "Menu"}</span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open ? <MobileMenu headerRef={headerRef} pathname={pathname} onClose={close} /> : null}
      </AnimatePresence>
    </>
  );
}

type MobileMenuProps = {
  headerRef: RefObject<HTMLElement | null>;
  pathname: string;
  onClose: (restoreFocus: boolean) => void;
};

/**
 * Disclosure-style menu controlled by the header toggle. While open, every
 * other part of the page is made `inert`, so Tab cycles only through the
 * header (incl. the close button) and the menu, and screen readers cannot
 * wander into the hidden page behind the overlay.
 */
function MobileMenu({ headerRef, pathname, onClose }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const keep = new Set<Element | null>([headerRef.current, panelRef.current]);
    const inerted = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        !keep.has(el) &&
        !el.inert &&
        el.tagName !== "SCRIPT" &&
        el.tagName !== "NEXT-ROUTE-ANNOUNCER",
    );
    inerted.forEach((el) => (el.inert = true));

    panelRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(true);
    };
    window.addEventListener("keydown", onKey);
    // Close if the viewport grows past the mobile breakpoint while open.
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onDesktop = (e: MediaQueryListEvent) => e.matches && onClose(false);
    desktop.addEventListener("change", onDesktop);

    return () => {
      document.body.style.overflow = overflow;
      inerted.forEach((el) => (el.inert = false));
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [headerRef, onClose]);

  return (
    <motion.div
      id={MENU_ID}
      ref={panelRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: duration.fast, ease: easeCalm }}
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-ink px-5 pt-28 pb-10 text-ivory lg:hidden"
    >
      <nav aria-label="Mobile" className="contents">
        {/* A gentle fade only — no sliding — so the list reads instantly. */}
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.base, ease: easeCalm, delay: 0.05 }}
          className="flex flex-col"
        >
          {mobileNav.map((item) => {
            const current = isCurrentPath(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onClose(false)}
                  aria-current={current ? "page" : undefined}
                  className="flex items-center justify-between gap-4 border-b border-white/10 py-4 font-display text-3xl transition-colors hover:text-gold-light aria-[current=page]:text-gold-light sm:text-4xl"
                >
                  {item.label}
                  {current ? (
                    <span aria-hidden className="font-sans text-xs font-semibold tracking-[0.16em] text-gold-light uppercase">
                      You are here
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </motion.ul>
      </nav>

      <div className="mt-auto flex flex-col gap-4 pt-10">
        <ButtonLink href={primaryCta.href} onClick={() => onClose(false)} size="lg">
          {primaryCta.label}
        </ButtonLink>
        <a
          href={siteConfig.contact.phoneHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 text-sm tracking-wide text-mist hover:text-ivory"
        >
          <Phone className="size-4" aria-hidden />
          {siteConfig.contact.phone}
        </a>
      </div>
    </motion.div>
  );
}
