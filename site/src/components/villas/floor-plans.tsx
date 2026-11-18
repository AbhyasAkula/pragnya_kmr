"use client";

import { FileWarning } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cn, formatNumber } from "@/lib/utils";
import type { FloorPlanLevel } from "@/types/content";

type FloorPlansProps = { levels: FloorPlanLevel[]; villaName: string; note: string };

/**
 * Floor plans as an accessible tab set (WAI-ARIA tabs: arrow keys, Home/End,
 * roving tabindex). Levels without an approved `drawing` show a clearly
 * labelled placeholder — no layout is ever invented.
 */
export function FloorPlans({ levels, villaName, note }: FloorPlansProps) {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = (i: number) => `${baseId}-panel-${i}`;

  const focusTab = (i: number) => {
    const next = (i + levels.length) % levels.length;
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => focusTab(i + 1),
      ArrowLeft: () => focusTab(i - 1),
      Home: () => focusTab(0),
      End: () => focusTab(levels.length - 1),
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  const total = levels.reduce((sum, l) => sum + l.area, 0);

  return (
    <div>
      <div
        role="tablist"
        aria-label={`${villaName} floor plans`}
        className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-white p-1"
      >
        {levels.map((level, i) => {
          const isSelected = i === selected;
          return (
            <button
              key={level.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={tabId(i)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId(i)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "min-h-11 shrink-0 rounded-full px-5 text-[0.75rem] font-semibold tracking-[0.14em] whitespace-nowrap uppercase transition-colors duration-300",
                isSelected ? "bg-ink text-ivory" : "text-stone hover:text-ink",
              )}
            >
              {level.label}
            </button>
          );
        })}
      </div>

      {levels.map((level, i) => (
        <div
          key={level.id}
          id={panelId(i)}
          role="tabpanel"
          aria-labelledby={tabId(i)}
          hidden={i !== selected}
          tabIndex={0}
          className="mt-8 grid gap-8 rounded-[1.75rem] focus-visible:outline-offset-4 lg:grid-cols-12 lg:gap-12"
        >
          <div className="lg:col-span-7">
            {level.drawing ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white">
                <Image src={level.drawing.src} alt={level.drawing.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain p-4" />
              </div>
            ) : (
              <PlaceholderDrawing label={`${villaName} — ${level.label}`} />
            )}
          </div>

          <div className="lg:col-span-5">
            <p className="eyebrow text-gold">{level.label}</p>
            <p className="mt-3 font-display text-4xl text-ink tabular-nums">
              {formatNumber(level.area)} <span className="text-2xl text-stone">sq ft*</span>
            </p>
            <h3 className="mt-8 text-xs font-semibold tracking-[0.14em] text-ink uppercase">Spaces on this level</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {level.rooms.map((room) => (
                <li key={room} className="py-3 text-ink">
                  {room}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      <p className="mt-8 text-xs text-stone">
        *Total indicative built-up area {formatNumber(total)} sq ft. {note}
      </p>
    </div>
  );
}

/** Obvious placeholder frame: hatched, labelled, and announced as such. */
function PlaceholderDrawing({ label }: { label: string }) {
  return (
    <figure
      className="relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-field bg-sand p-6 text-center"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent 0 18px, color-mix(in oklab, var(--color-field) 18%, transparent) 18px 19px)",
      }}
    >
      <span className="absolute top-4 left-4 rounded-full bg-ink px-3 py-1 text-xs font-semibold tracking-[0.18em] text-ivory uppercase">
        Placeholder
      </span>
      <FileWarning className="size-10 text-gold" strokeWidth={1.25} aria-hidden />
      <p className="mt-4 font-display text-2xl text-ink">Floor plan coming soon</p>
      <figcaption className="mt-2 max-w-xs text-sm text-stone">
        {label}: approved architectural drawing to be supplied. Not a representation of the actual layout.
      </figcaption>
    </figure>
  );
}
