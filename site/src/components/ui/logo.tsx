import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Placeholder wordmark — swap the SVG monogram for the client's logo. */
export function Logo({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const onDark = tone === "dark";
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — home`}
      className={cn("group inline-flex items-center gap-3", className)}
    >
      <svg
        viewBox="0 0 40 40"
        aria-hidden
        className={cn(
          "size-9 transition-transform duration-500 ease-luxe group-hover:rotate-45",
          onDark ? "text-gold-light" : "text-gold",
        )}
      >
        <rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(45 20 20)" />
        <path d="M13 27 20 11l7 16M15.6 21.5h8.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-2xl font-medium tracking-[0.14em] uppercase",
            onDark ? "text-ivory" : "text-ink",
          )}
        >
          {siteConfig.logo.wordmark}
        </span>
        <span className={cn("mt-1 text-[0.6rem] font-semibold tracking-[0.42em] uppercase", onDark ? "text-mist" : "text-stone")}>
          {siteConfig.logo.subline}
        </span>
      </span>
    </Link>
  );
}
