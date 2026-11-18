import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { villaPath } from "@/components/villas/villa-card";
import { cn } from "@/lib/utils";
import type { MasterPlanZone, VillaModel } from "@/types/content";
import { zoneSwatch } from "./plan-diagram";

/** Legend keyed by the same numbers drawn on the plan (never colour alone). */
export function PlanLegend({ zones, villas }: { zones: MasterPlanZone[]; villas: VillaModel[] }) {
  return (
    <ol className="divide-y divide-line rounded-[1.75rem] border border-line bg-white/60" aria-label="Master plan legend">
      {zones.map((zone) => {
        const villa = zone.villaSlug ? villas.find((v) => v.slug === zone.villaSlug) : undefined;
        return (
          <li key={zone.id} className="flex gap-4 p-5">
            <span className="relative mt-0.5 inline-flex size-9 shrink-0 items-center justify-center">
              <span aria-hidden className={cn("absolute inset-0 rounded-full", zoneSwatch[zone.tone])} />
              <span className="relative inline-flex size-6 items-center justify-center rounded-full bg-ivory text-xs font-semibold text-ink ring-1 ring-ink tabular-nums">
                {zone.marker}
              </span>
            </span>
            <div className="min-w-0">
              <p className="font-display text-xl text-ink">{zone.label}</p>
              <p className="mt-1 text-sm text-stone">{zone.description}</p>
              {villa ? (
                <Link
                  href={villaPath(villa.slug)}
                  className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-gold underline-offset-4 hover:underline"
                >
                  {villa.unitCount} × {villa.name}
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
