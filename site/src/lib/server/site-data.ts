import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { TAGS, contentTag } from "@/lib/cache-tags";
import { contentDefaults } from "@/lib/content/defaults";
import { contentSchemas, type ContentKey, type ContentValue } from "@/lib/validation/cms";
import type {
  ConstructionMilestone,
  ConstructionUpdate,
  FloorPlanLevel,
  GalleryImage,
  MediaItem,
  VillaModel,
} from "@/types/content";
import { getDb } from "./db";
import { logServerEvent } from "./log";

/**
 * Cached reads of PUBLISHED content for the public website. Drafts never
 * leave the database through these functions. Results are cached until an
 * admin change calls updateTag() for the matching tag.
 */

export async function loadContent<K extends ContentKey>(key: K): Promise<ContentValue<K>> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.content, contentTag(key));
  const row = await getDb().contentEntry.findUnique({ where: { key }, select: { data: true } });
  if (!row) return contentDefaults[key];
  const parsed = contentSchemas[key].safeParse(row.data);
  if (!parsed.success) {
    logServerEvent("content.invalid_stored_value");
    return contentDefaults[key];
  }
  return parsed.data as ContentValue<K>;
}

/**
 * Uncached read of a content section, for request-time decisions that must
 * be exact the moment an admin changes them (e.g. the online-booking switch
 * checked by POST /api/site-visit).
 */
export async function readContentNow<K extends ContentKey>(key: K): Promise<ContentValue<K>> {
  const row = await getDb().contentEntry.findUnique({ where: { key }, select: { data: true } });
  const parsed = row ? contentSchemas[key].safeParse(row.data) : null;
  return (parsed?.success ? parsed.data : contentDefaults[key]) as ContentValue<K>;
}

const availabilityToStatus ={ AVAILABLE: "available", LIMITED: "limited", SOLD_OUT: "sold-out" } as const;

export async function loadPublishedVillas(): Promise<VillaModel[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.villas);
  const rows = await getDb().villa.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((v) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    configuration: v.configuration,
    builtUpArea: v.builtUpArea,
    plotArea: v.plotArea,
    bedrooms: v.bedrooms,
    bathrooms: v.bathrooms,
    floors: v.floors,
    carParks: v.carParks,
    unitCount: v.unitCount,
    startingPrice: v.startingPrice,
    status: availabilityToStatus[v.availability],
    summary: v.summary,
    description: v.description,
    highlights: v.highlights,
    image: v.image as VillaModel["image"],
    gallery: v.gallery as VillaModel["gallery"],
    floorPlans: v.floorPlans as FloorPlanLevel[],
  }));
}

export async function loadPublishedGallery(): Promise<GalleryImage[]> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.gallery);
  const rows = await getDb().galleryItem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((g) => ({
    id: g.id,
    src: g.src,
    alt: g.alt,
    caption: g.caption,
    category: g.category.toLowerCase() as GalleryImage["category"],
    source: g.source.toLowerCase() as GalleryImage["source"],
    featured: g.featured,
    ...(g.kind === "VIDEO"
      ? { kind: "video" as const, video: { ...(g.videoUrl ? { src: g.videoUrl } : {}), ...(g.videoDuration ? { duration: g.videoDuration } : {}) } }
      : {}),
  }));
}

const milestoneStatus = { COMPLETED: "completed", IN_PROGRESS: "in-progress", UPCOMING: "upcoming" } as const;

export async function loadPublishedConstruction(): Promise<{
  milestones: ConstructionMilestone[];
  updates: ConstructionUpdate[];
}> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.construction);
  const db = getDb();
  const [milestones, updates] = await Promise.all([
    db.constructionMilestone.findMany({ where: { visible: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    db.constructionUpdate.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
  ]);
  return {
    milestones: milestones.map((m) => ({ id: m.id, title: m.title, status: milestoneStatus[m.status], date: m.dateLabel })),
    updates: updates.map((u) => ({
      id: u.id,
      date: u.date.toISOString().slice(0, 10),
      title: u.title,
      summary: u.summary,
      overallProgress: u.overallProgress,
      areas: u.areas as ConstructionUpdate["areas"],
      media: u.media as MediaItem[],
      sample: u.isSample,
    })),
  };
}
