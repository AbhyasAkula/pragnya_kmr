/**
 * PLACEHOLDER COPY — fictional project details for design purposes.
 * All visible homepage copy lives here (UI micro-labels such as form field
 * names stay with their components). Headline numbers come from
 * `projectFacts` so they cannot drift apart.
 */
import { siteConfig } from "@/config/site";
import { formatNumber, formatPriceINR } from "@/lib/utils";
import type {
  AmenitiesSectionContent,
  GalleryImage,
  HeroContent,
  ProjectOverview,
  SectionCopy,
  SiteVisitContent,
  VillaSectionContent,
} from "@/types/content";
import { images } from "./images";
import { villas } from "./villas";
import { projectFacts as facts } from "./project";

export const hero: HeroContent = {
  eyebrow: `Gated villa community · ${siteConfig.location.city}`,
  title: "Where quiet luxury",
  titleAccent: "finds its address",
  subtitle: `${facts.villaCount} architect-designed villas set across ${facts.landAcres} acres of landscaped greens — private, secure and minutes from the city.`,
  secondaryCta: { label: "Explore Villas", href: "/#villas" },
  image: {
    src: images.heroDusk,
    alt: "Contemporary two-storey villa with warm interior lighting at dusk",
  },
  facts: [
    { value: String(facts.landAcres), label: "Acres" },
    { value: String(facts.villaCount), label: "Private villas" },
    { value: `${facts.openSpacePercent}%`, label: "Open space" },
    { value: "RERA", label: facts.reraStatus },
  ],
};

export const overview: ProjectOverview = {
  eyebrow: "The Enclave",
  title: "A private world, thoughtfully composed",
  badge: facts.phaseLabel,
  paragraphs: [
    `${siteConfig.name} is planned around the way families actually live — wide tree-lined avenues, generous setbacks between homes, and a central green spine that connects every villa to the clubhouse on foot.`,
    "Each residence is oriented for natural light and cross-ventilation, finished with premium materials, and backed by an on-site estate management team.",
  ],
  highlights: [
    "Single-entry gated community with 3-tier security",
    "Underground utilities and rainwater harvesting",
    "Vastu-aligned, east & north facing plots",
    `Phase I possession from ${facts.possession}`,
  ],
  stats: [
    { value: facts.landAcres, label: "Acres of land" },
    { value: facts.villaCount, label: "Villas" },
    { value: Math.round(facts.clubhouseSqFt / 1000), suffix: "K", label: "Sq ft clubhouse" },
    { value: facts.openSpacePercent, suffix: "%", label: "Open & green" },
  ],
  images: {
    primary: {
      src: images.overviewPool,
      alt: "Villa with floor-to-ceiling glass opening onto a private pool deck",
    },
    secondary: {
      src: images.overviewLiving,
      alt: "Double-height living room with an open timber staircase",
    },
  },
};

export const amenitiesSection: AmenitiesSectionContent = {
  eyebrow: "Amenities",
  title: "Resort living,",
  accent: "every day",
  description: `A ${formatNumber(facts.clubhouseSqFt)} sq ft clubhouse and over ${facts.amenityCount} curated amenities, all within a short stroll of your front door.`,
  featureImage: {
    src: images.amenityPool,
    alt: "Infinity pool lined with cabanas overlooking the horizon at dusk",
  },
  featureCaption: "The infinity pool deck",
};

export const villaSection: VillaSectionContent = {
  eyebrow: "Villa collection",
  title: "Three residences,",
  accent: "one standard",
  description:
    "Every villa is built on its own title plot with private gardens, premium finishes and room to grow.",
  ctaLabel: "Request floor plans",
  priceNote: "*Indicative starting prices. Registration, GST and other statutory charges extra.",
};

export const gallerySection: SectionCopy = {
  eyebrow: "Gallery",
  title: "Glimpses of",
  accent: `life at ${siteConfig.shortName}`,
  description: "Artistic impressions of homes, interiors and landscapes across the enclave.",
};

export const gallery: GalleryImage[] = [
  {
    id: "g-1",
    src: images.galleryWhiteVilla,
    alt: "White minimalist villa with glass walls beside a pool",
    caption: "Poolside living",
    category: "exteriors",
  },
  {
    id: "g-2",
    src: images.galleryLounge,
    alt: "Sunlit lounge with leather sofas and a gallery wall",
    caption: "Family lounge",
    category: "interiors",
  },
  {
    id: "g-3",
    src: images.galleryCourtyard,
    alt: "Courtyard pool framed by arched verandas at night",
    caption: "Evening courtyard",
    category: "landscape",
  },
  {
    id: "g-4",
    src: images.galleryBedroom,
    alt: "Master bedroom with an upholstered headboard and bench",
    caption: "Master suite",
    category: "interiors",
  },
  {
    id: "g-5",
    src: images.galleryTerrace,
    alt: "Three-storey villa with glass balustrades and a large pool",
    caption: "Signature terraces",
    category: "exteriors",
  },
  {
    id: "g-6",
    src: images.galleryVeranda,
    alt: "Colonial-style villa with a wraparound veranda and palms",
    caption: "Garden veranda",
    category: "landscape",
  },
];

export const siteVisit: SiteVisitContent = {
  eyebrow: "Private site visits",
  title: `Experience ${siteConfig.shortName} in person`,
  description:
    "Walk the avenues, tour the show villa and meet our relationship team. We'll arrange a complimentary pick-up from anywhere in the city.",
  image: {
    src: images.siteVisit,
    alt: "Two-storey villa reflected in a pool under a cloudy sky",
  },
  formTitle: "Book a private tour",
  formSubtitle: "Takes less than a minute. No obligations.",
  perks: [{ icon: "car", text: "Complimentary chauffeured pick-up" }],
};

/** Meta description, derived from the same facts shown on the page. */
export const seoDescription = (() => {
  const from = Math.min(...villas.map((v) => v.startingPrice));
  return `${siteConfig.name} is a ${facts.landAcres}-acre gated community of ${facts.villaCount} private villas with a ${formatNumber(facts.clubhouseSqFt)} sq ft clubhouse, landscaped parks and 24/7 security. ${facts.configurations} villas from ${formatPriceINR(from)}.`;
})();
