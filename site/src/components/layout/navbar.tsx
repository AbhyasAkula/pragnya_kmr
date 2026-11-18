"use client";

import { AnimatePresence, motion } from "motion/react";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Logo } from "@/components/ui/logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { duration, easeCalm } from "@/config/motion";
import { isCurrentPath, mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { whatsappHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

const MENU_ID = "mobile-menu";
/** Desktop navigation appears from this width (Tailwind `lg`). Keep in sync with the classes below. */
const DESKTOP_QUERY = "(min-width: 64rem)";

/**
 * Site header: logo + one compact, evenly spaced row of page links on
 * desktop; a clean hamburger menu below `lg`. Always visible. Transparent
 * over the dark hero, frosted ivory once the page scrolls.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update(); // correct state when a page loads mid-scroll
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  /** `restoreFocus` is false after following a menu link, so focus follows the destination. */
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
            ? "border-b border-line/80 bg-ivory/90 shadow-[0_8px_30px_-20px_rgba(28,25,23,0.35)] backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <nav aria-label="Primary" className="container-site flex h-[4.5rem] items-center justify-between gap-6 lg:h-20">
          <Logo tone={solid && !open ? "light" : "dark"} className="shrink-0" />

          <ul className="hidden items-center gap-1 lg:flex xl:gap-2">
            {mainNav.map((item) => {
              const current = isCurrentPath(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center px-2.5 text-[0.78rem] font-medium tracking-[0.12em] whitespace-nowrap uppercase transition-colors duration-300 xl:px-3",
                      "after:absolute after:inset-x-2.5 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-calm hover:after:scale-x-100 xl:after:inset-x-3",
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

          <button
            ref={toggleRef}
            type="button"
            onClick={() => (open ? close(false) : setOpen(true))}
            aria-expanded={open}
            aria-controls={MENU_ID}
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full transition-colors duration-300 lg:hidden",
              open ? "text-white hover:bg-white/10" : solid ? "text-ink hover:bg-ink/5" : "text-white hover:bg-white/10",
            )}
          >
            {open ? <X className="size-6" strokeWidth={1.5} aria-hidden /> : <Menu className="size-6" strokeWidth={1.5} aria-hidden />}
          </button>
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
    const desktop = window.matchMedia(DESKTOP_QUERY);
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
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-ink px-5 pt-24 pb-8 text-ivory lg:hidden"
    >
      <nav aria-label="Mobile" className="contents">
        <ul className="flex flex-col">
          {mainNav.map((item) => {
            const current = isCurrentPath(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onClose(false)}
                  aria-current={current ? "page" : undefined}
                  className="flex min-h-14 items-center justify-between gap-4 border-b border-white/10 font-display text-[1.75rem] transition-colors hover:text-gold-light aria-[current=page]:text-gold-light"
                >
                  {item.label}
                  {current ? <span aria-hidden className="size-1.5 rounded-full bg-gold-light" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick contact — uses the configured numbers */}
      <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
        <a
          href={siteConfig.contact.phoneHref}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-medium text-ivory hover:border-white"
        >
          <Phone className="size-4" aria-hidden />
          Call
        </a>
        <a
          href={whatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold-light text-sm font-semibold text-ink hover:bg-gold-pale"
        >
          <WhatsAppIcon className="size-4" />
          WhatsApp<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </motion.div>
  );
}
