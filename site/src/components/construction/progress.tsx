import { Check, CircleDashed, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConstructionMilestone, ConstructionStatus } from "@/types/content";

/** Accessible progress bar (value is also printed as text). */
export function ProgressBar({ label, value, tone = "light" }: { label: string; value: number; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className={dark ? "text-mist" : "text-ink"}>{label}</span>
        <span className={cn("font-semibold tabular-nums", dark ? "text-ivory" : "text-ink")}>{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("mt-2 h-2 overflow-hidden rounded-full", dark ? "bg-white/15" : "bg-line")}
      >
        <div className={cn("h-full rounded-full", dark ? "bg-gold-light" : "bg-gold")} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const statusMeta: Record<ConstructionStatus, { label: string; icon: typeof Check; dot: string }> = {
  completed: { label: "Completed", icon: Check, dot: "bg-ink text-ivory" },
  "in-progress": { label: "In progress", icon: Clock, dot: "bg-gold-light text-ink" },
  upcoming: { label: "Upcoming", icon: CircleDashed, dot: "border border-field bg-ivory text-stone" },
};

/** Vertical milestone timeline; status is conveyed by icon + text, not colour alone. */
export function MilestoneTimeline({ milestones }: { milestones: ConstructionMilestone[] }) {
  return (
    <ol className="relative">
      {milestones.map((m, i) => {
        const meta = statusMeta[m.status];
        const Icon = meta.icon;
        const last = i === milestones.length - 1;
        return (
          <li key={m.id} className="relative flex gap-5 pb-8 last:pb-0">
            {!last ? <span aria-hidden className="absolute top-10 bottom-0 left-5 w-px -translate-x-1/2 bg-line" /> : null}
            <span className={cn("relative inline-flex size-10 shrink-0 items-center justify-center rounded-full", meta.dot)}>
              <Icon className="size-4" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 pt-1">
              <p className="font-display text-2xl text-ink">{m.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span
                  className={cn(
                    "font-semibold",
                    m.status === "completed" ? "text-ink" : m.status === "in-progress" ? "text-gold" : "text-stone",
                  )}
                >
                  {meta.label}
                </span>
                <span className="text-stone">{m.date}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
