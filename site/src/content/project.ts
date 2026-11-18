/**
 * PLACEHOLDER PROJECT FACTS — the single source for every headline number.
 * Hero facts, overview stats, amenity copy and the SEO description are all
 * derived from these values, so updating one number updates it everywhere.
 */
import { villas } from "./villas";

export const projectFacts = {
  landAcres: 42,
  /** Derived from the per-model unit counts so the totals can never disagree. */
  villaCount: villas.reduce((sum, v) => sum + v.unitCount, 0),
  openSpacePercent: 80,
  clubhouseSqFt: 45_000,
  amenityCount: 30,
  /** Regulatory status label shown in the hero. Confirm wording with the client. */
  reraStatus: "Approved",
  phaseLabel: "Phase I · Now open",
  possession: "December 2027",
  configurations: "3 & 4 BHK",
} as const;
