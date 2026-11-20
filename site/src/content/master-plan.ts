/**
 * PLACEHOLDER MASTER PLAN — an abstract zoning diagram for design purposes.
 * It is NOT an approved layout, survey or architectural drawing. Replace
 * `masterPlan.drawing` with the approved plan image when supplied; the
 * diagram below is then hidden automatically.
 */
import type { ImageAsset, MasterPlanZone } from "@/types/content";

export const masterPlan: {
  /** Approved master plan image. Absent = placeholder diagram is rendered. */
  drawing?: ImageAsset;
  canvas: { width: number; height: number };
  zones: MasterPlanZone[];
  disclaimer: string;
} = {
  canvas: { width: 1200, height: 800 },
  zones: [
    {
      id: "z-magnolia",
      marker: 1,
      label: "Magnolia precinct",
      description: "3 BHK villas around shaded garden courts.",
      tone: "gold-light",
      shape: { x: 80, y: 90, width: 340, height: 620, radius: 28 },
      villaSlug: "the-magnolia",
    },
    {
      id: "z-cypress",
      marker: 2,
      label: "Cypress precinct",
      description: "4 BHK pool villas facing the park edge.",
      tone: "clay",
      shape: { x: 780, y: 90, width: 340, height: 360, radius: 28 },
      villaSlug: "the-cypress",
    },
    {
      id: "z-banyan",
      marker: 3,
      label: "Banyan precinct",
      description: "Signature residences on the largest plots.",
      tone: "umber",
      shape: { x: 780, y: 480, width: 340, height: 230, radius: 28 },
      villaSlug: "the-banyan",
    },
    {
      id: "z-park",
      marker: 4,
      label: "Central park",
      description: "The green spine with lawns, gardens and the jogging loop.",
      tone: "sage",
      shape: { x: 470, y: 90, width: 260, height: 210, radius: 40 },
    },
    {
      id: "z-clubhouse",
      marker: 5,
      label: "Clubhouse & pools",
      description: "{clubhouseSqFt} sq ft clubhouse with the pool deck.",
      tone: "ink",
      shape: { x: 500, y: 330, width: 200, height: 130, radius: 20 },
    },
    {
      id: "z-sports",
      marker: 6,
      label: "Sports zone",
      description: "Courts, cricket nets and the children's play area.",
      tone: "sage-deep",
      shape: { x: 470, y: 490, width: 260, height: 160, radius: 24 },
    },
    {
      id: "z-entry",
      marker: 7,
      label: "Entry gate & security",
      description: "Single controlled entry with visitor management.",
      tone: "stone",
      shape: { x: 545, y: 690, width: 110, height: 52, radius: 14 },
    },
  ],
  disclaimer:
    "Illustrative placeholder diagram, not to scale. It does not represent an approved layout. The approved master plan will replace it once available.",
};
