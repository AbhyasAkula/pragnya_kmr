/**
 * PLACEHOLDER COMPANY CONTENT — fictional, for design purposes.
 *
 * Company-level information lives here, separate from project-level data
 * (src/content/project.ts, villas.ts …), so future projects can be added
 * without touching the company story.
 *
 * Aurelia Enclave is the company's FIRST project: do not add past projects,
 * awards, delivery records or other achievements here unless they are real
 * and verified. This file must not import site config (avoids a cycle).
 */
export type CompanyValueIcon = "craft" | "transparency" | "nature" | "community";

export const company = {
  name: "Aurelia Estates",
  shortDescription: "A new residential developer focused on thoughtfully planned, low-density communities.",
  story: {
    eyebrow: "Our story",
    title: "Beginning with",
    accent: "one community, done well",
    paragraphs: [
      "Aurelia Estates was founded with a simple belief: a home should be planned around the people who live in it — their light, their privacy, their time outdoors and their neighbours.",
      "Aurelia Enclave is our first project. Rather than start with scale, we chose to start with a single gated community that we can plan carefully, build patiently and look after properly.",
      "Everything we learn here — from the families who choose to live with us — will shape every community that follows.",
    ],
  },
  vision: {
    title: "Our vision",
    text: "To create calm, well-planned neighbourhoods where families feel at home for generations.",
  },
  mission: {
    title: "Our mission",
    text: "To design and build homes with honesty, attention to detail and respect for the land — and to communicate openly with every buyer from first visit to handover.",
  },
  values: [
    {
      icon: "craft" as CompanyValueIcon,
      title: "Craft over shortcuts",
      text: "We would rather take the time to get a detail right than move quickly and live with it later.",
    },
    {
      icon: "transparency" as CompanyValueIcon,
      title: "Open communication",
      text: "Clear pricing, clear documentation and regular construction updates, shared as they happen.",
    },
    {
      icon: "nature" as CompanyValueIcon,
      title: "Respect for the land",
      text: "Generous open spaces, native planting and water-conscious landscape design.",
    },
    {
      icon: "community" as CompanyValueIcon,
      title: "Community first",
      text: "Shared spaces planned for real everyday use by children, families and elders alike.",
    },
  ],
  /** How we intend to work — commitments, not claims of past results. */
  quality: {
    eyebrow: "Commitment to quality",
    title: "How we",
    accent: "intend to build",
    description:
      "These are the standards we are setting for ourselves on our first project, and the ones we invite every buyer to hold us to.",
    commitments: [
      { title: "Considered design", text: "Homes planned for natural light, cross-ventilation and privacy before anything else." },
      { title: "Chosen materials", text: "Finishes selected for durability and ease of upkeep, with specifications shared in writing." },
      { title: "Supervised construction", text: "Stage-wise site supervision, with progress published on our construction updates page." },
      { title: "Careful handover", text: "A walk-through of every home before handover, with an on-site estate team afterwards." },
    ],
  },
} as const;
