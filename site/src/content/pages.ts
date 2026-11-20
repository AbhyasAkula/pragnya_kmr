/** PLACEHOLDER COPY for the interior pages (hero + section intros). */
import { siteConfig } from "@/config/site";
import type { PageIntro, SectionCopy } from "@/types/content";
import { images } from "./images";

export const villasPage = {
  hero: {
    eyebrow: "The villa collection",
    title: "{villaModelCount} residences,",
    accent: "one standard of living",
    description: "{villaCount} independent villas across {villaModelCount} models, each on its own plot with a private garden and room to grow.",
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
    title: "{landAcres} acres,",
    accent: "thoughtfully composed",
    description: "How {villaCount} villas, a central park and the clubhouse come together within a single gated community.",
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
};

export const amenitiesPage = {
  hero: {
    eyebrow: "Amenities",
    title: "Resort living,",
    accent: "every single day",
    description: "A {clubhouseSqFt} sq ft clubhouse and over {amenityCount} curated amenities, all within a short stroll of home at {projectName}.",
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

export const galleryPage = {
  hero: {
    eyebrow: "Gallery",
    title: "Life at Aurelia,",
    accent: "in pictures",
    description: "Villas, interiors, amenities and the community — every image labelled as a render or a photograph.",
    image: { src: images.galleryTerrace, alt: "Three-storey villa with glass balustrades and a large pool" },
  } satisfies PageIntro,
  browse: {
    eyebrow: "Browse",
    title: "Photos and",
    accent: "videos",
    description: "Filter by category, then select any image to view it full screen.",
  } satisfies SectionCopy,
};

export const constructionPage = {
  hero: {
    eyebrow: "Construction progress",
    title: "Building Aurelia,",
    accent: "step by step",
    description: "Regular updates from site, with milestones, photographs and videos.",
    image: { src: images.constructionSiteLayout, alt: "Aerial view of a construction site with the site team" },
  } satisfies PageIntro,
  latest: { eyebrow: "Latest update", title: "Where things", accent: "stand today" } satisfies SectionCopy,
  milestones: { eyebrow: "Milestones", title: "From groundbreaking to", accent: "handover" } satisfies SectionCopy,
  history: { eyebrow: "Earlier updates", title: "Progress", accent: "so far" } satisfies SectionCopy,
};

export const aboutPage = {
  hero: {
    eyebrow: "About us",
    title: "A developer",
    accent: "built on care",
    description: "The people and principles behind Aurelia Enclave.",
    image: { src: images.aboutPlanning, alt: "Architect reviewing drawings at a drafting table" },
  } satisfies PageIntro,
  storyImage: { src: images.exteriorTimberFacade, alt: "Contemporary villa with timber screens behind a gated driveway" },
  values: { eyebrow: "What guides us", title: "Our", accent: "values" } satisfies SectionCopy,
  project: {
    eyebrow: "Our first project",
    title: "Introducing",
    accent: siteConfig.name,
  } satisfies SectionCopy,
};

export const contactPage = {
  hero: {
    eyebrow: "Get in touch",
    title: `Experience ${siteConfig.name} in Person`,
    description:
      "We're here to help you explore the villas, walk through the community and plan your visit at your convenience.",
    image: { src: images.heroDusk, alt: "Contemporary two-storey villa with warm interior lighting at dusk" },
  } satisfies PageIntro,
  form: {
    eyebrow: "Book a site visit",
    title: "Schedule Your Visit",
    description: "Fill in your details and our team will get in touch to confirm your site visit.",
  } satisfies SectionCopy,
  /** PLACEHOLDER image for the location card — replace with the real entrance photo or render. */
  locationImage: { src: images.exteriorTimberFacade, alt: "Gated villa entrance with timber screens and a landscaped driveway" },
};
