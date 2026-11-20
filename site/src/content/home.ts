/**
 * PLACEHOLDER COPY — fictional project details for design purposes.
 *
 * These are the DEFAULT homepage sections: they seed the database (see
 * prisma/seed.ts) and are used as a fallback if a section has never been
 * saved. Day-to-day edits happen in the admin dashboard (Content).
 *
 * `{tokens}` are filled in when the page is rendered, so headline numbers
 * always match Project details and the published villas — see
 * src/lib/content/tokens.ts for the list.
 */
import type {
  AmenitiesSectionContent,
  HeroCopy,
  OverviewCopy,
  SectionCopy,
  SiteVisitContent,
  VillaSectionContent,
} from "@/types/content";
import { images } from "./images";

export const hero: HeroCopy = {
  eyebrow: "Gated villa community · {city}",
  title: "Where quiet luxury",
  titleAccent: "finds its address",
  subtitle:
    "{villaCount} architect-designed villas set across {landAcres} acres of landscaped greens — private, secure and minutes from the city.",
  secondaryCta: { label: "Explore Villas", href: "/#villas" },
  image: {
    src: images.heroDusk,
    alt: "Contemporary two-storey villa with warm interior lighting at dusk",
  },
};

export const overview: OverviewCopy = {
  eyebrow: "The Enclave",
  title: "A private world, thoughtfully composed",
  badge: "{phaseLabel}",
  paragraphs: [
    "{projectName} is planned around the way families actually live — wide tree-lined avenues, generous setbacks between homes, and a central green spine that connects every villa to the clubhouse on foot.",
    "Each residence is oriented for natural light and cross-ventilation, finished with premium materials, and backed by an on-site estate management team.",
  ],
  highlights: [
    "Single-entry gated community with 3-tier security",
    "Underground utilities and rainwater harvesting",
    "Vastu-aligned, east & north facing plots",
    "Phase I possession from {possession}",
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
  description:
    "A {clubhouseSqFt} sq ft clubhouse and over {amenityCount} curated amenities, all within a short stroll of your front door.",
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
  accent: "life at {shortName}",
  description: "Artistic impressions of homes, interiors and landscapes across the enclave.",
};

export const siteVisit: SiteVisitContent = {
  eyebrow: "Private site visits",
  title: "Experience {shortName} in person",
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

/** Meta description template (tokens filled at render time). */
export const seoDescription =
  "{projectName} is a {landAcres}-acre gated community of {villaCount} private villas with a {clubhouseSqFt} sq ft clubhouse, landscaped parks and 24/7 security. {configurations} villas from {startingPrice}.";
