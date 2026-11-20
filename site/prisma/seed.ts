/**
 * One-time, NON-DESTRUCTIVE seed: copies the site's existing (placeholder)
 * content from src/content into the database so the admin dashboard can
 * edit it. It only fills empty tables / missing content sections and never
 * updates or deletes existing rows, so it is safe to re-run.
 *
 *   npm run db:seed
 *
 * Bookings, staff and audit logs are never touched.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { constructionMilestones, constructionUpdates } from "../src/content/construction";
import { gallery } from "../src/content/gallery";
import { villas } from "../src/content/villas";
import { PrismaClient } from "../src/generated/prisma/client";
import { contentDefaults } from "../src/lib/content/defaults";
import { contentSchemas, contentKeys } from "../src/lib/validation/cms";

const url = new URL(process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "");
for (const p of ["sslmode", "schema"]) url.searchParams.delete(p);
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } }, { schema: "aurelia" }),
});

const availability = { available: "AVAILABLE", limited: "LIMITED", "sold-out": "SOLD_OUT" } as const;
const milestoneStatus = { completed: "COMPLETED", "in-progress": "IN_PROGRESS", upcoming: "UPCOMING" } as const;

async function main() {
  const now = new Date();
  const report: string[] = [];

  if ((await db.villa.count()) === 0) {
    await db.villa.createMany({
      data: villas.map((v, i) => ({
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
        availability: availability[v.status],
        summary: v.summary,
        description: v.description,
        highlights: v.highlights,
        image: v.image,
        gallery: v.gallery,
        floorPlans: v.floorPlans,
        sortOrder: i,
        status: "PUBLISHED",
        publishedAt: now,
      })),
    });
    report.push(`villas: inserted ${villas.length}`);
  } else report.push("villas: already populated, skipped");

  if ((await db.galleryItem.count()) === 0) {
    await db.galleryItem.createMany({
      data: gallery.map((g, i) => ({
        kind: g.kind === "video" ? "VIDEO" : "IMAGE",
        src: g.src,
        alt: g.alt,
        caption: g.caption,
        category: g.category.toUpperCase() as "VILLAS" | "INTERIORS" | "AMENITIES" | "COMMUNITY",
        source: g.source === "render" ? "RENDER" : "PHOTO",
        featured: Boolean(g.featured),
        videoUrl: g.video?.src ?? null,
        videoDuration: g.video?.duration ?? null,
        sortOrder: i,
        status: "PUBLISHED",
      })),
    });
    report.push(`gallery_items: inserted ${gallery.length}`);
  } else report.push("gallery_items: already populated, skipped");

  if ((await db.constructionMilestone.count()) === 0) {
    await db.constructionMilestone.createMany({
      data: constructionMilestones.map((m, i) => ({
        title: m.title,
        status: milestoneStatus[m.status],
        dateLabel: m.date,
        sortOrder: i,
        visible: true,
      })),
    });
    report.push(`construction_milestones: inserted ${constructionMilestones.length}`);
  } else report.push("construction_milestones: already populated, skipped");

  if ((await db.constructionUpdate.count()) === 0) {
    await db.constructionUpdate.createMany({
      data: constructionUpdates.map((u) => ({
        date: new Date(`${u.date}T00:00:00.000Z`),
        title: u.title,
        summary: u.summary,
        overallProgress: u.overallProgress,
        areas: u.areas,
        media: u.media,
        isSample: u.sample,
        status: "PUBLISHED",
        publishedAt: now,
      })),
    });
    report.push(`construction_updates: inserted ${constructionUpdates.length} (flagged as sample)`);
  } else report.push("construction_updates: already populated, skipped");

  let added = 0;
  for (const key of contentKeys) {
    const value = contentSchemas[key].parse(contentDefaults[key]); // defaults must pass validation
    const res = await db.contentEntry.createMany({ data: [{ key, data: value as object }], skipDuplicates: true });
    added += res.count;
  }
  report.push(`content_entries: inserted ${added} missing section(s) of ${contentKeys.length}`);

  console.log(report.join("\n"));
}

main()
  .catch((e) => {
    console.error("Seed failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
