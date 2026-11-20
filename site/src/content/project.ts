/**
 * PLACEHOLDER PROJECT FACTS — default values (seed + fallback). Edited in the
 * admin dashboard under Content → Project details.
 *
 * The villa count is NOT stored: it is always derived from the unit counts
 * of the published villas, so the totals can never disagree.
 */
import type { ProjectFactsInput } from "@/types/content";

export const projectFacts: ProjectFactsInput = {
  landAcres: 42,
  openSpacePercent: 80,
  clubhouseSqFt: 45_000,
  amenityCount: 30,
  /** Regulatory status label shown in the hero. Confirm wording with the client. */
  reraStatus: "Approved",
  phaseLabel: "Phase I · Now open",
  possession: "December 2027",
  configurations: "3 & 4 BHK",
};
