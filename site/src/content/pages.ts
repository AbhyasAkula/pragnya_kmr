/** PLACEHOLDER COPY for the interior pages (hero + section intros). */
import { siteConfig } from "@/config/site";
import { formatNumber } from "@/lib/utils";
import type { PageIntro, SectionCopy } from "@/types/content";
import { images } from "./images";
import { projectFacts as facts } from "./project";
import { villas } from "./villas";

export const villasPage = {
  hero: {
    eyebrow: "The villa collection",
    title: `${villas.length} residences,`,
    accent: "one standard of living",
    description: `${facts.villaCount} independent villas across ${villas.length} models, each on its own plot with a private garden and room to grow.`,
    image: { src: images.exteriorWhitePool, alt: "White contemporary villa with a pool and sun loungers" },
  } satisfies PageIntro,
  listing: {
    eyebrow: "Choose your home",
    title: "Explore the",
    accent: "models",
    description: "Compare sizes, layouts and starting prices, then step inside each residence.",
  } satisfies SectionCopy,
  comparison: {
    eyebrow: "At a glance",
    title: "Compare the",
    accent: "collection",
  } satisfies SectionCopy,
  cta: {
    eyebrow: "See them in person",
    title: "Walk through the",
    accent: "show villa",
    description: "Book a private site visit and our team will guide you through the models that suit your family.",
  } satisfies SectionCopy,
};

export const villaDetailCopy = {
  overview: { eyebrow: "The residence", title: "Designed around the way", accent: "you live" },
  gallery: { eyebrow: "Gallery", title: "Inside", accent: "and out" },
  floorPlans: { eyebrow: "Floor plans", title: "Level by", accent: "level" },
  specifications: { eyebrow: "Specifications", title: "Built with", accent: "care" },
  others: { eyebrow: "Also in the collection", title: "Other", accent: "residences" },
};

export const masterPlanPage = {
  hero: {
    eyebrow: "Master plan",
    title: `${facts.landAcres} acres,`,
    accent: "thoughtfully composed",
    description: `How ${facts.villaCount} villas, a central park and the clubhouse come together within a single gated community.`,
    image: { src: images.exteriorTimberFacade, alt: "Contemporary villa with timber screens behind a gated driveway" },
  } satisfies PageIntro,
  plan: {
    eyebrow: "Site layout",
    title: "The plan at a",
    accent: "glance",
    description: "Zoom and pan the diagram, or use the legend to learn what each zone holds.",
  } satisfies SectionCopy,
  highlights: {
    eyebrow: "Project highlights",
    title: "Planned around",
    accent: "open space",
  } satisfies SectionCopy,
  points: [
    "Single controlled entry for the whole community",
    "Central park linking every precinct on foot",
    "Clubhouse at the heart of the plan",
    "Vehicle roads kept to the edges of each precinct",
  ],
  models: {
    eyebrow: "Villa models",
    title: "Where each",
    accent: "home sits",
    description: "Each precinct is dedicated to one villa model, so neighbours share a similar scale of home.",
  } satisfies SectionCopy,
  cta: {
    eyebrow: "Visit the site",
    title: "See the plan",
    accent: "on the ground",
    description: "Tour the precincts, clubhouse and show villa with our relationship team.",
  } satisfies SectionCopy,
};

export const amenitiesPage = {
  hero: {
    eyebrow: "Amenities",
    title: "Resort living,",
    accent: "every single day",
    description: `A ${formatNumber(facts.clubhouseSqFt)} sq ft clubhouse and over ${facts.amenityCount} curated amenities, all within a short stroll of home at ${siteConfig.name}.`,
    image: { src: images.amenityResortDeck, alt: "Resort-style pool deck with loungers beneath a timber pavilion" },
  } satisfies PageIntro,
  categories: {
    eyebrow: "Everything on site",
    title: "Amenities by",
    accent: "category",
    description: "Jump to a category, or browse the full list below.",
  } satisfies SectionCopy,
  cta: {
    eyebrow: "Experience it",
    title: "Spend a morning",
    accent: "at the clubhouse",
    description: "Book a site visit to tour the clubhouse, pools and gardens.",
  } satisfies SectionCopy,
};
