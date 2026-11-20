"use client";

import {
  Building2,
  CalendarCheck,
  ExternalLink,
  FileText,
  HardHat,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type NavKey = "dashboard" | "bookings" | "villas" | "gallery" | "construction" | "content" | "staff" | "audit" | "settings";

const NAV: { group: string; items: { key: NavKey; href: string; label: string; icon: LucideIcon }[] }[] = [
  { group: "", items: [{ key: "dashboard", href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  { group: "Sales", items: [{ key: "bookings", href: "/admin/bookings", label: "Bookings", icon: CalendarCheck }] },
  {
    group: "Website",
    items: [
      { key: "villas", href: "/admin/villas", label: "Villas", icon: Building2 },
      { key: "gallery", href: "/admin/gallery", label: "Gallery", icon: Images },
      { key: "construction", href: "/admin/construction", label: "Construction", icon: HardHat },
      { key: "content", href: "/admin/content", label: "Content", icon: FileText },
    ],
  },
  {
    group: "Administration",
    items: [
      { key: "staff", href: "/admin/staff", label: "Staff", icon: Users },
      { key: "audit", href: "/admin/audit", label: "Audit log", icon: ScrollText },
      { key: "settings", href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  allowed,
  user,
  signOutAction,
  children,
}: {
  allowed: NavKey[];
  user: { fullName: string; email: string; role: "OWNER" | "STAFF" };
  signOutAction: (formData: FormData) => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the drawer on Escape (links close it on click).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = (
    <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV.map((g) => {
        const items = g.items.filter((i) => allowed.includes(i.key));
        if (items.length === 0) return null;
        return (
          <div key={g.group || "main"} className="mb-5">
            {g.group ? <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold tracking-[0.14em] text-mist/70 uppercase">{g.group}</p> : null}
            <ul className="space-y-0.5">
              {items.map(({ key, href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                        active ? "bg-white/10 text-ivory" : "text-mist hover:bg-white/5 hover:text-ivory",
                      )}
                    >
                      <Icon className={cn("size-[1.125rem] shrink-0", active ? "text-gold-light" : "text-mist/80")} aria-hidden />
                      {label}
                      {active ? <span aria-hidden className="ml-auto h-5 w-0.5 rounded-full bg-gold-light" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const userBox = (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-light/20 text-sm font-semibold text-gold-light" aria-hidden>
          {user.fullName.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ivory">{user.fullName}</p>
          <p className="truncate text-xs text-mist">{user.role === "OWNER" ? "Owner" : "Staff"}</p>
        </div>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1">
        <Link href="/admin/account" onClick={() => setOpen(false)} className="flex min-h-10 items-center justify-center gap-2 rounded-lg text-xs font-medium text-mist hover:bg-white/5 hover:text-ivory">
          <UserRound className="size-4" aria-hidden /> Account
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-mist hover:bg-white/5 hover:text-ivory">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
      <span className="font-display text-xl tracking-[0.14em] text-ivory uppercase">Aurelia</span>
      <span className="rounded-full border border-gold-light/40 px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.16em] text-gold-light uppercase">Admin</span>
    </div>
  );

  return (
    <div className="min-h-svh lg:pl-64">
      <a href="#admin-main" className="sr-only z-[100] rounded-lg bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink lg:flex">
        {brand}
        {nav}
        {userBox}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur lg:hidden">
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-lg text-ink hover:bg-sand"
        >
          <Menu className="size-5" aria-hidden />
          <span className="sr-only">Open menu</span>
        </button>
        <span className="font-display text-lg tracking-[0.14em] uppercase">Aurelia</span>
        <Link href="/" target="_blank" className="-mr-2 inline-flex size-11 items-center justify-center rounded-lg text-stone hover:bg-sand" aria-label="View website (opens in a new tab)">
          <ExternalLink className="size-5" aria-hidden />
        </Link>
      </header>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" id="admin-drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-ink shadow-2xl">
            <div className="flex items-center justify-between pr-2">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="inline-flex size-11 items-center justify-center rounded-lg text-mist hover:text-ivory" aria-label="Close menu">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {nav}
            {userBox}
          </div>
        </div>
      ) : null}

      <div className="hidden h-14 items-center justify-end border-b border-line px-8 lg:flex">
        <Link href="/" target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-stone hover:bg-sand hover:text-ink">
          View website <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </div>

      <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
