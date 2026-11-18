import type { MasterPlanZone } from "@/types/content";

/** Static class names so Tailwind can see them (tones come from content). */
export const zoneFill: Record<MasterPlanZone["tone"], string> = {
  "gold-light": "fill-gold-light",
  clay: "fill-clay",
  umber: "fill-umber",
  ink: "fill-ink",
  sage: "fill-sage",
  "sage-deep": "fill-sage-deep",
  stone: "fill-stone",
};

export const zoneSwatch: Record<MasterPlanZone["tone"], string> = {
  "gold-light": "bg-gold-light",
  clay: "bg-clay",
  umber: "bg-umber",
  ink: "bg-ink",
  sage: "bg-sage",
  "sage-deep": "bg-sage-deep",
  stone: "bg-stone",
};

type PlanDiagramProps = {
  zones: MasterPlanZone[];
  width: number;
  height: number;
  /** Accessible summary; the legend carries the detail. */
  title: string;
};

/**
 * PLACEHOLDER zoning diagram drawn from content data. Deliberately abstract
 * (blocks, no plot numbers, dimensions or orientation) and watermarked, so it
 * cannot be mistaken for an approved layout.
 */
export function PlanDiagram({ zones, width, height, title }: PlanDiagramProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby="plan-svg-title"
      className="size-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="plan-svg-title">{title}</title>
      <defs>
        <pattern id="plan-plots" width="34" height="34" patternUnits="userSpaceOnUse">
          <rect x="5" y="5" width="24" height="24" rx="5" className="fill-ivory" opacity="0.4" />
        </pattern>
      </defs>

      {/* Site boundary */}
      <rect x="40" y="40" width={width - 80} height={height - 80} rx="40" className="fill-ivory stroke-field" strokeWidth="2" strokeDasharray="10 8" />

      {/* Internal roads (abstract) */}
      <g className="stroke-white" strokeWidth="16" strokeLinecap="round" fill="none">
        <rect x="440" y="62" width="320" height="616" rx="34" />
        <path d="M420 400 H440 M760 270 H780 M760 595 H780 M600 678 V690" />
      </g>

      {/* Jogging loop around the park */}
      <rect x="456" y="76" width="288" height="238" rx="50" fill="none" className="stroke-umber" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" opacity="0.6" />

      {zones.map((zone) => {
        const { x, y, width: w, height: h, radius = 20 } = zone.shape;
        const cx = x + w / 2;
        const cy = y + h / 2;
        return (
          <g key={zone.id}>
            <rect x={x} y={y} width={w} height={h} rx={radius} className={zoneFill[zone.tone]} opacity={zone.tone === "ink" ? 0.92 : 0.85} />
            {zone.villaSlug ? <rect x={x} y={y} width={w} height={h} rx={radius} fill="url(#plan-plots)" /> : null}
            <circle cx={cx} cy={cy} r="24" className="fill-ivory stroke-ink" strokeWidth="2" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="fill-ink font-sans" fontSize="22" fontWeight="600">
              {zone.marker}
            </text>
          </g>
        );
      })}

      {/* Watermark — impossible to miss, never removed while this diagram is shown */}
      <g className="fill-ink font-sans" opacity="0.09" fontSize="46" fontWeight="600" letterSpacing="6" textAnchor="middle" pointerEvents="none">
        <text x={width / 2} y={height * 0.3} transform={`rotate(-18 ${width / 2} ${height * 0.3})`}>ILLUSTRATIVE PLACEHOLDER</text>
        <text x={width / 2} y={height * 0.72} transform={`rotate(-18 ${width / 2} ${height * 0.72})`}>NOT TO SCALE</text>
      </g>
      <g>
        <rect x="56" y={height - 92} width="330" height="40" rx="20" className="fill-ink" />
        <text x="221" y={height - 72} textAnchor="middle" dominantBaseline="central" className="fill-ivory font-sans" fontSize="15" fontWeight="600" letterSpacing="2.5">
          PLACEHOLDER · NOT TO SCALE
        </text>
      </g>
    </svg>
  );
}
