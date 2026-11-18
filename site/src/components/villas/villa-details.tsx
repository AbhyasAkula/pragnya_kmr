import { Bath, BedDouble, Car, Check, Layers, LandPlot, Ruler } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { cn, formatNumber, formatPriceINR } from "@/lib/utils";
import type { SpecificationGroup, VillaModel } from "@/types/content";
import { villaPath, villaStatusLabel } from "./villa-card";
import Link from "next/link";

/** Key facts strip for the villa hero (glass panel on dark imagery). */
export function VillaKeyFacts({ villa }: { villa: VillaModel }) {
  const facts = [
    { label: "Bedrooms", value: String(villa.bedrooms) },
    { label: "Built-up", value: `${formatNumber(villa.builtUpArea)} sq ft` },
    { label: "Plot", value: `${villa.plotArea} sq yd` },
    { label: "Starting from", value: `${formatPriceINR(villa.startingPrice)}*` },
  ];
  return (
    <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md sm:mt-16 md:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col gap-1 bg-ink/30 px-6 py-5">
          <dt className="order-2 text-xs font-semibold tracking-[0.22em] text-white/75 uppercase">{fact.label}</dt>
          <dd className="order-1 font-display text-3xl text-white tabular-nums sm:text-4xl">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Full specification list for the sticky summary card. */
export function VillaSpecList({ villa, className }: { villa: VillaModel; className?: string }) {
  const rows = [
    { icon: BedDouble, label: "Bedrooms", value: villa.bedrooms },
    { icon: Bath, label: "Bathrooms", value: villa.bathrooms },
    { icon: Ruler, label: "Built-up area", value: `${formatNumber(villa.builtUpArea)} sq ft` },
    { icon: LandPlot, label: "Plot size", value: `${villa.plotArea} sq yd` },
    { icon: Layers, label: "Levels", value: `G + ${villa.floors - 1} with terrace` },
    { icon: Car, label: "Covered parking", value: `${villa.carParks} cars` },
  ];
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center justify-between gap-4 py-3.5">
          <dt className="flex items-center gap-3 text-sm text-stone">
            <Icon className="size-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
            {label}
          </dt>
          <dd className="text-right text-sm font-medium text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function VillaHighlights({ items }: { items: string[] }) {
  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <RevealItem key={item} className="flex items-start gap-4 rounded-2xl border border-line bg-white/60 p-5">
          <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-light/25 text-gold">
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-ink">{item}</span>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export function Specifications({ groups, note }: { groups: SpecificationGroup[]; note: string }) {
  return (
    <>
      <RevealGroup className="grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <RevealItem key={group.id} className="bg-ivory p-7 sm:p-8">
            <h3 className="font-display text-2xl text-ink">{group.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-stone">
              {group.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </RevealItem>
        ))}
      </RevealGroup>
      <p className="mt-6 text-xs text-stone">{note}</p>
    </>
  );
}

/**
 * Side-by-side comparison. A real <table> for screen readers; on small
 * screens it scrolls horizontally inside a labelled, focusable region.
 */
export function VillaComparison({ villas, caption }: { villas: VillaModel[]; caption: string }) {
  const rows: { label: string; value: (v: VillaModel) => string }[] = [
    { label: "Configuration", value: (v) => v.configuration },
    { label: "Built-up area", value: (v) => `${formatNumber(v.builtUpArea)} sq ft` },
    { label: "Plot size", value: (v) => `${v.plotArea} sq yd` },
    { label: "Bedrooms", value: (v) => String(v.bedrooms) },
    { label: "Bathrooms", value: (v) => String(v.bathrooms) },
    { label: "Covered parking", value: (v) => `${v.carParks} cars` },
    { label: "Homes in the community", value: (v) => String(v.unitCount) },
    { label: "Availability", value: (v) => villaStatusLabel[v.status] },
    { label: "Starting from", value: (v) => `${formatPriceINR(v.startingPrice)}*` },
  ];
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-[1.75rem] border border-line bg-ivory focus-visible:outline-offset-4"
    >
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="p-5 text-xs font-semibold tracking-[0.14em] text-stone uppercase sm:p-6">
              <span className="sr-only">Feature</span>
            </th>
            {villas.map((v) => (
              <th key={v.id} scope="col" className="p-5 align-bottom sm:p-6">
                <Link href={villaPath(v.slug)} className="font-display text-2xl font-medium text-ink underline-offset-4 hover:text-gold hover:underline">
                  {v.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-b-0">
              <th scope="row" className="p-5 font-medium text-stone sm:px-6">
                {row.label}
              </th>
              {villas.map((v) => (
                <td key={v.id} className="p-5 text-ink sm:px-6">
                  {row.value(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
