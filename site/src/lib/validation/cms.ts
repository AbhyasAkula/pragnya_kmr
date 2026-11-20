/**
 * Validation for everything editable in the admin dashboard (shared by the
 * forms and the server actions; the server is the authority). Limits keep
 * copy within what the public layouts were designed for.
 */
import { z } from "zod";
import { isAllowedImageSrc } from "@/lib/media";

/* -------------------------------- helpers -------------------------------- */

export const text = (max: number) => z.string().trim().min(1, "Required").max(max, `Keep this under ${max} characters`);
export const optionalText = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);
const intIn = (min: number, max: number) =>
  z.number({ error: "Enter a number" }).int("Use a whole number").min(min, `Minimum ${min}`).max(max, `Maximum ${max}`);
const list = <T extends z.ZodType>(item: T, max: number, min = 0) =>
  z.array(item).min(min, min === 1 ? "Add at least one" : `Add at least ${min}`).max(max, `At most ${max} items`);
const localId = z.string().trim().min(1).max(60).regex(/^[a-z0-9][a-z0-9-]*$/i, "Invalid id");

/** Internal path (/villas) or https link. */
export const href = z
  .string()
  .trim()
  .min(1, "Required")
  .max(300)
  .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/.test(v), "Use a site path like /villas or an https:// link");

export const image = z.object({
  src: z.string().trim().min(1, "Choose an image").max(600).refine(isAllowedImageSrc, "Upload the image through the dashboard"),
  alt: text(200),
});

export const sectionCopy = z.object({
  eyebrow: text(60),
  title: text(120),
  accent: optionalText(120).optional(),
  description: optionalText(600).optional(),
});

/* ------------------------------- content keys ------------------------------ */

const amenityIcons = [
  "clubhouse", "pool", "fitness", "spa", "courts", "trails", "kids", "security", "banquet", "cowork", "theatre", "cafe",
  "yoga", "sauna", "deck", "cricket", "squash", "cycling", "creche", "seniors", "pets", "amphitheatre", "park", "garden",
  "barbecue", "access", "ev", "parking", "estate",
] as const;
export const amenityCategoryIds = ["clubhouse", "wellness", "aquatics", "sports", "family", "outdoors", "services"] as const;
const zoneTones = ["gold-light", "clay", "umber", "ink", "sage", "sage-deep", "stone"] as const;

export const contentSchemas = {
  "project.facts": z.object({
    landAcres: intIn(1, 100_000),
    openSpacePercent: intIn(0, 100),
    clubhouseSqFt: intIn(0, 10_000_000),
    amenityCount: intIn(0, 1000),
    reraStatus: text(40),
    phaseLabel: text(60),
    possession: text(40),
    configurations: text(40),
  }),
  "home.hero": z.object({
    eyebrow: text(80),
    title: text(80),
    titleAccent: text(80),
    subtitle: text(400),
    secondaryCta: z.object({ label: text(40), href }),
    image,
  }),
  "home.overview": z.object({
    eyebrow: text(60),
    title: text(120),
    badge: text(60),
    paragraphs: list(text(800), 6, 1),
    highlights: list(text(160), 10),
    images: z.object({ primary: image, secondary: image }),
  }),
  "home.villaSection": sectionCopy.extend({ ctaLabel: text(40), priceNote: text(300) }),
  "home.amenitiesSection": sectionCopy.extend({ featureImage: image, featureCaption: text(80) }),
  "home.gallerySection": sectionCopy,
  "home.siteVisit": sectionCopy.extend({
    image,
    formTitle: text(80),
    formSubtitle: text(160),
    perks: list(z.object({ icon: z.enum(["car", "sparkles", "calendar"]), text: text(80) }), 3),
  }),
  amenities: z.object({
    categories: z
      .array(z.object({ id: z.enum(amenityCategoryIds), title: text(60), description: text(200) }))
      .length(amenityCategoryIds.length),
    items: list(
      z.object({
        id: localId,
        title: text(60),
        description: text(200),
        icon: z.enum(amenityIcons),
        category: z.enum(amenityCategoryIds),
        featured: z.boolean().optional(),
      }),
      80,
      1,
    ),
    features: list(
      z.object({ id: localId, eyebrow: text(40), title: text(120), description: text(600), points: list(text(120), 6), image }),
      8,
    ),
  }),
  masterPlan: z.object({
    drawing: image.optional(),
    canvas: z.object({ width: z.number(), height: z.number() }),
    zones: list(
      z.object({
        id: localId,
        marker: intIn(1, 99),
        label: text(60),
        description: text(200),
        tone: z.enum(zoneTones),
        shape: z.object({
          x: z.number(),
          y: z.number(),
          width: z.number().positive(),
          height: z.number().positive(),
          radius: z.number().optional(),
        }),
        villaSlug: z
          .string()
          .trim()
          .max(80)
          .transform((v) => v || undefined)
          .optional(),
      }),
      20,
      1,
    ),
    disclaimer: text(400),
  }),
  "villas.specifications": z.object({
    groups: list(z.object({ id: localId, title: text(60), items: list(text(200), 12, 1) }), 12, 1),
    note: text(400),
    floorPlanNote: text(400),
  }),
  contact: z.object({
    phone: text(20).regex(/^\+?[\d\s().-]{10,20}$/, "Enter a phone number, e.g. +91 98765 43210"),
    whatsapp: z.string().trim().regex(/^\d{10,15}$/, "Digits only with country code, e.g. 919876543210"),
    whatsappMessage: text(300),
    email: z.email("Enter a valid email address").max(254),
    hours: text(120),
    street: text(160),
    city: text(60),
    region: text(60),
    postalCode: text(12),
    mapUrl: z.url({ protocol: /^https$/, error: "Use an https:// map link" }).max(500),
  }),
  settings: z.object({
    acceptingOnlineBookings: z.boolean(),
    reraNumber: text(40),
    privacyPolicyUrl: z
      .string()
      .trim()
      .max(300)
      .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/.test(v), "Use https:// or a site path")
      .transform((v) => (v === "" ? null : v))
      .nullable(),
  }),
  "gallery.page": z.object({ notice: optionalText(400) }),
} as const;

export type ContentKey = keyof typeof contentSchemas;
export type ContentValue<K extends ContentKey> = z.output<(typeof contentSchemas)[K]>;
export const contentKeys = Object.keys(contentSchemas) as ContentKey[];

/* -------------------------------- entities -------------------------------- */

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Required")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, e.g. the-magnolia");

export const villaSchema = z.object({
  name: text(80),
  slug,
  configuration: text(60),
  builtUpArea: intIn(1, 100_000),
  plotArea: intIn(1, 100_000),
  bedrooms: intIn(0, 20),
  bathrooms: intIn(0, 20),
  floors: intIn(1, 10),
  carParks: intIn(0, 20),
  unitCount: intIn(0, 10_000),
  startingPrice: intIn(0, 2_000_000_000),
  availability: z.enum(["AVAILABLE", "LIMITED", "SOLD_OUT"]),
  summary: text(300),
  description: list(text(1200), 6, 1),
  highlights: list(text(160), 10),
  image,
  gallery: list(z.object({ id: localId, src: image.shape.src, alt: text(200), caption: text(80) }), 24),
  floorPlans: list(
    z.object({
      id: localId,
      label: text(40),
      area: intIn(0, 100_000),
      rooms: list(text(100), 20),
      drawing: image.optional(),
    }),
    6,
  ),
});
export type VillaInput = z.output<typeof villaSchema>;

export const galleryItemSchema = z.object({
  kind: z.enum(["IMAGE", "VIDEO"]),
  src: image.shape.src,
  alt: text(200),
  caption: text(120),
  category: z.enum(["VILLAS", "INTERIORS", "AMENITIES", "COMMUNITY"]),
  source: z.enum(["RENDER", "PHOTO"]),
  featured: z.boolean(),
  videoUrl: z
    .string()
    .trim()
    .max(600)
    .refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "Use an https:// video link")
    .transform((v) => v || null),
  videoDuration: optionalText(16).transform((v) => v || null),
  mediaId: z.uuid().nullable().optional(),
});
export type GalleryItemInput = z.output<typeof galleryItemSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const constructionUpdateSchema = z.object({
  date: isoDate,
  title: text(120),
  summary: text(1500),
  overallProgress: intIn(0, 100),
  areas: list(z.object({ label: text(60), progress: intIn(0, 100) }), 10),
  media: list(
    z.object({
      id: localId,
      src: image.shape.src,
      alt: text(200),
      caption: text(120),
      source: z.enum(["render", "photo"]),
      /** Video placeholder tile (cover image only; no video file yet). */
      kind: z.literal("video").optional(),
    }),
    20,
  ),
  isSample: z.boolean(),
});
export type ConstructionUpdateInput = z.output<typeof constructionUpdateSchema>;

export const milestonesSchema = z.object({
  milestones: list(
    z.object({
      id: z.string().max(40).optional(),
      title: text(120),
      status: z.enum(["COMPLETED", "IN_PROGRESS", "UPCOMING"]),
      dateLabel: text(60),
      visible: z.boolean(),
    }),
    40,
  ),
});

/** Flattens Zod issues into { "path.to.field": message } for inline errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}
