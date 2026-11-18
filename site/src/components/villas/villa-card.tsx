import { ArrowUpRight, Bath, BedDouble, LandPlot, Ruler } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatNumber, formatPriceINR } from "@/lib/utils";
import type { VillaModel, VillaStatus } from "@/types/content";

export const villaStatusLabel: Record<VillaStatus, string> = {
  available: "Available",
  limited: "Few units left",
  "sold-out": "Sold out",
};

export const villaPath = (slug: string) => `/villas/${slug}` as const;

type VillaCardProps = {
  villa: VillaModel;
  /** Heading level for the villa name; use "h2" when cards are the page's main list. */
  headingAs?: "h2" | "h3";
  className?: string;
};

/** Villa model card (homepage + /villas). The whole card links to the detail page. */
export function VillaCard({ villa, headingAs: Heading = "h3", className }: VillaCardProps) {
  const specs = [
    { icon: BedDouble, label: `${villa.bedrooms} Beds` },
    { icon: Bath, label: `${villa.bathrooms} Baths` },
    { icon: Ruler, label: `${formatNumber(villa.builtUpArea)} sq ft` },
    { icon: LandPlot, label: `${villa.plotArea} sq yd plot` },
  ];

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-[0_30px_60px_-40px_rgba(28,25,23,0.45)] transition-shadow duration-500 ease-luxe hover:shadow-[0_40px_80px_-40px_rgba(28,25,23,0.6)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={villa.image.src}
          alt={villa.image.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
        />
        <span
          className={cn(
            "absolute top-5 left-5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase backdrop-blur",
            villa.status === "limited" ? "bg-gold-light text-ink" : "bg-ivory/90 text-ink",
          )}
        >
          {villaStatusLabel[villa.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-7 sm:p-8">
        <p className="eyebrow text-xs text-gold">{villa.configuration}</p>
        <Heading className="mt-3 text-3xl text-ink sm:text-[2.1rem]">{villa.name}</Heading>
        <p className="mt-3 text-sm text-stone">{villa.summary}</p>

        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-6 text-sm text-ink tabular-nums">
          {specs.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon className="size-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-stone uppercase">Starting from</p>
            <p className="font-display text-3xl text-ink tabular-nums">{formatPriceINR(villa.startingPrice)}*</p>
          </div>
          {/* Stretched link: the whole card is clickable. */}
          <Link
            href={villaPath(villa.slug)}
            aria-label={`View ${villa.name} details`}
            className="inline-flex size-12 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory after:absolute after:inset-0"
          >
            <ArrowUpRight className="size-5 transition-transform duration-500 ease-luxe group-hover:rotate-45" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
