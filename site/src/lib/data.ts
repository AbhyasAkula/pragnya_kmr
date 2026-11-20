/**
 * Data access layer for the public website. Components call these async
 * functions; content comes from the database (published items only, cached
 * and refreshed when the admin dashboard publishes a change — see
 * src/lib/server/site-data.ts). Return shapes are unchanged from the static
 * version, so pages and components did not need to change.
 */
import "server-only";
import { siteConfig } from "@/config/site";
import { company } from "@/content/company";
import { constructionNotice } from "@/content/construction";
import { galleryCategories } from "@/content/gallery";
import { seoDescription } from "@/content/home";
import * as pages from "@/content/pages";
import { fillTokens, type TokenValues } from "@/lib/content/tokens";
import {
  loadContent,
  loadPublishedConstruction,
  loadPublishedGallery,
  loadPublishedVillas,
} from "@/lib/server/site-data";
import { formatNumber, formatPriceINR } from "@/lib/utils";
import type { HeroContent, ProjectFacts, ProjectOverview, SiteContact, SiteSettings } from "@/types/content";

/* ------------------------------ shared values ----------------------------- */

export async function getProjectFacts(): Promise<ProjectFacts> {
  const [facts, villas] = await Promise.all([loadContent("project.facts"), loadPublishedVillas()]);
  return { ...facts, villaCount: villas.reduce((sum, v) => sum + v.unitCount, 0) };
}

export async function getContactDetails(): Promise<SiteContact> {
  return loadContent("contact");
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return loadContent("settings");
}

/** Values for `{tokens}` in editable copy. */
async function getTokens(): Promise<TokenValues> {
  const [facts, villas, contact] = await Promise.all([getProjectFacts(), loadPublishedVillas(), getContactDetails()]);
  const prices = villas.map((v) => v.startingPrice).filter((p) => p > 0);
  return {
    projectName: siteConfig.name,
    shortName: siteConfig.shortName,
    city: contact.city,
    villaCount: formatNumber(facts.villaCount),
    villaModelCount: String(villas.length),
    landAcres: formatNumber(facts.landAcres),
    openSpacePercent: String(facts.openSpacePercent),
    clubhouseSqFt: formatNumber(facts.clubhouseSqFt),
    amenityCount: String(facts.amenityCount),
    possession: facts.possession,
    configurations: facts.configurations,
    phaseLabel: facts.phaseLabel,
    reraStatus: facts.reraStatus,
    startingPrice: prices.length ? formatPriceINR(Math.min(...prices)) : "",
  };
}

async function filled<T>(value: T | Promise<T>): Promise<T> {
  const [v, tokens] = await Promise.all([value, getTokens()]);
  return fillTokens(v, tokens);
}

/* ------------------------------- Homepage ------------------------------- */

export async function getHeroContent(): Promise<HeroContent> {
  const [hero, facts] = await Promise.all([filled(loadContent("home.hero")), getProjectFacts()]);
  return {
    ...hero,
    facts: [
      { value: String(facts.landAcres), label: "Acres" },
      { value: String(facts.villaCount), label: "Private villas" },
      { value: `${facts.openSpacePercent}%`, label: "Open space" },
      { value: "RERA", label: facts.reraStatus },
    ],
  };
}

export async function getProjectOverview(): Promise<ProjectOverview> {
  const [overview, facts] = await Promise.all([filled(loadContent("home.overview")), getProjectFacts()]);
  return {
    ...overview,
    stats: [
      { value: facts.landAcres, label: "Acres of land" },
      { value: facts.villaCount, label: "Villas" },
      { value: Math.round(facts.clubhouseSqFt / 1000), suffix: "K", label: "Sq ft clubhouse" },
      { value: facts.openSpacePercent, suffix: "%", label: "Open & green" },
    ],
  };
}

export async function getVillaSection() {
  const [section, villas] = await Promise.all([filled(loadContent("home.villaSection")), loadPublishedVillas()]);
  return { ...section, villas };
}

export async function getAmenities() {
  const [section, amenities] = await Promise.all([filled(loadContent("home.amenitiesSection")), filled(loadContent("amenities"))]);
  return { ...section, items: amenities.items.filter((a) => a.featured) };
}

export async function getGalleryPreview(limit = 6) {
  const [section, items] = await Promise.all([filled(loadContent("home.gallerySection")), loadPublishedGallery()]);
  const featured = items.filter((g) => g.featured && g.kind !== "video");
  return { ...section, images: featured.slice(0, limit) };
}

export async function getSiteVisitContent() {
  const [section, villas] = await Promise.all([filled(loadContent("home.siteVisit")), loadPublishedVillas()]);
  return { ...section, villaOptions: villas.map((v) => v.name) };
}

export async function getSeoDescription() {
  return filled(seoDescription);
}

/* -------------------------------- Villas -------------------------------- */

export async function getVillaModels() {
  return loadPublishedVillas();
}

export async function getVillaBySlug(slug: string) {
  return (await loadPublishedVillas()).find((v) => v.slug === slug) ?? null;
}

export async function getVillaSlugs() {
  return (await loadPublishedVillas()).map((v) => v.slug);
}

export async function getVillaSpecifications() {
  const specs = await filled(loadContent("villas.specifications"));
  return { groups: specs.groups, note: specs.note, floorPlanNote: specs.floorPlanNote };
}

export async function getVillasPageContent() {
  return filled(pages.villasPage);
}

export async function getVillaDetailCopy() {
  return pages.villaDetailCopy;
}

/** Villa names accepted by the enquiry form (server-side whitelist). */
export async function getEnquiryVillaOptions() {
  return (await loadPublishedVillas()).map((v) => v.name);
}

/* ------------------------------ Master plan ----------------------------- */

export async function getMasterPlanContent() {
  const [page, plan, villas] = await Promise.all([
    filled(pages.masterPlanPage),
    filled(loadContent("masterPlan")),
    loadPublishedVillas(),
  ]);
  // Only link zones to villas that are currently published.
  const slugs = new Set(villas.map((v) => v.slug));
  const zones = plan.zones.map((z) => (z.villaSlug && !slugs.has(z.villaSlug) ? { ...z, villaSlug: undefined } : z));
  return { ...page, plan: { ...page.plan, ...plan, zones } };
}

/* ------------------------------- Amenities ------------------------------ */

export async function getAmenitiesPageContent() {
  const [page, amenities] = await Promise.all([filled(pages.amenitiesPage), filled(loadContent("amenities"))]);
  const { hero, categories: categoriesIntro, cta } = page;
  return {
    hero,
    categoriesIntro,
    cta,
    categories: amenities.categories,
    amenities: amenities.items,
    features: amenities.features,
  };
}

/* -------------------------------- Gallery ------------------------------- */

export async function getGalleryPageContent() {
  const [page, items, galleryPage] = await Promise.all([
    filled(pages.galleryPage),
    loadPublishedGallery(),
    loadContent("gallery.page"),
  ]);
  return { ...page, categories: galleryCategories, items, notice: galleryPage.notice || null };
}

/* ------------------------- Construction progress ------------------------ */

export async function getConstructionContent() {
  const [page, data] = await Promise.all([filled(pages.constructionPage), loadPublishedConstruction()]);
  const [latest, ...earlier] = await filled(data.updates);
  return {
    ...page,
    milestoneList: await filled(data.milestones),
    latestUpdate: latest ?? null,
    earlierUpdates: earlier,
    // The "sample data" notice is shown only while sample updates are published.
    notice: data.updates.some((u) => u.sample) ? constructionNotice : null,
  };
}

/* --------------------------------- About -------------------------------- */

export async function getAboutContent() {
  return { ...pages.aboutPage, company, facts: await getProjectFacts() };
}

/* -------------------------------- Contact ------------------------------- */

export async function getContactContent() {
  const villas = await loadPublishedVillas();
  return {
    ...pages.contactPage,
    villaOptions: villas.map((v) => ({ slug: v.slug, name: v.name, configuration: v.configuration })),
  };
}
