/**
 * Content models. These mirror the shape a future CMS / admin dashboard
 * would return, so UI components never depend on where data comes from.
 */

export type ImageAsset = {
  src: string;
  alt: string;
  /** Optional blur placeholder (base64) once real assets are self-hosted. */
  blurDataURL?: string;
};

export type Stat = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
};

/** Eyebrow + heading (+ optional italic accent) + intro used by every section. */
export type SectionCopy = {
  eyebrow: string;
  title: string;
  /** Rendered after `title` in italic accent colour. */
  accent?: string;
  description?: string;
};

export type Link = { label: string; href: string };

export type ProjectOverview = {
  eyebrow: string;
  title: string;
  badge: string;
  paragraphs: string[];
  highlights: string[];
  stats: Stat[];
  images: { primary: ImageAsset; secondary: ImageAsset };
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  secondaryCta: Link;
  image: ImageAsset;
  facts: { value: string; label: string }[];
};

export type VillaSectionContent = SectionCopy & { ctaLabel: string; priceNote: string };

export type AmenitiesSectionContent = SectionCopy & {
  featureImage: ImageAsset;
  featureCaption: string;
};

export type SiteVisitContent = SectionCopy & {
  image: ImageAsset;
  formTitle: string;
  formSubtitle: string;
  /** Extra selling points shown above the office hours and phone number. */
  perks: { icon: SiteVisitPerkIcon; text: string }[];
};

export type SiteVisitPerkIcon = "car" | "sparkles" | "calendar";

export type VillaStatus = "available" | "limited" | "sold-out";

/** One level of a villa. Drawings are PLACEHOLDERS until approved plans exist. */
export type FloorPlanLevel = {
  id: string;
  label: string; // e.g. "Ground floor"
  area: number; // sq ft (indicative)
  rooms: string[];
  /** Approved drawing, once supplied by the architect. Absent = placeholder shown. */
  drawing?: ImageAsset;
};

export type VillaModel = {
  id: string;
  slug: string;
  name: string;
  configuration: string;
  builtUpArea: number; // sq ft
  plotArea: number; // sq yd
  bedrooms: number;
  bathrooms: number;
  floors: number;
  carParks: number;
  /** Number of homes of this model in the community. */
  unitCount: number;
  startingPrice: number; // INR
  status: VillaStatus;
  summary: string;
  description: string[];
  highlights: string[];
  image: ImageAsset;
  gallery: (ImageAsset & { id: string; caption: string })[];
  floorPlans: FloorPlanLevel[];
};

export type SpecificationGroup = { id: string; title: string; items: string[] };

export type AmenityIcon =
  | "clubhouse"
  | "pool"
  | "fitness"
  | "spa"
  | "courts"
  | "trails"
  | "kids"
  | "security"
  | "banquet"
  | "cowork"
  | "theatre"
  | "cafe"
  | "yoga"
  | "sauna"
  | "deck"
  | "cricket"
  | "squash"
  | "cycling"
  | "creche"
  | "seniors"
  | "pets"
  | "amphitheatre"
  | "park"
  | "garden"
  | "barbecue"
  | "access"
  | "ev"
  | "parking"
  | "estate";

export type AmenityCategoryId =
  | "clubhouse"
  | "wellness"
  | "aquatics"
  | "sports"
  | "family"
  | "outdoors"
  | "services";

export type AmenityCategory = {
  id: AmenityCategoryId;
  title: string;
  description: string;
};

export type Amenity = {
  id: string;
  title: string;
  description: string;
  icon: AmenityIcon;
  category: AmenityCategoryId;
  /** Shown in the homepage amenities preview. */
  featured?: boolean;
};

/** Image + copy band on the amenities page. */
export type AmenityFeature = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  image: ImageAsset;
};

export type PageIntro = SectionCopy & { image: ImageAsset };

/** Zone on the (placeholder) master plan diagram. Coordinates use a 1200×800 canvas. */
export type MasterPlanZone = {
  id: string;
  marker: number;
  label: string;
  description: string;
  /** Design-token colour name used for the swatch and fill. */
  tone: "gold-light" | "clay" | "umber" | "ink" | "sage" | "sage-deep" | "stone";
  shape: { x: number; y: number; width: number; height: number; radius?: number };
  /** Links the zone to a villa model when it is a residential precinct. */
  villaSlug?: string;
};

export type GalleryCategory = "exteriors" | "interiors" | "amenities" | "landscape";

export type GalleryImage = ImageAsset & {
  id: string;
  caption: string;
  category: GalleryCategory;
};
