/**
 * Data access layer. Components call these async functions instead of
 * importing content directly, so the source can later move to a CMS,
 * database or the admin dashboard API without touching the UI.
 */
import * as amenityContent from "@/content/amenities";
import { company } from "@/content/company";
import * as construction from "@/content/construction";
import * as galleryContent from "@/content/gallery";
import * as home from "@/content/home";
import { masterPlan } from "@/content/master-plan";
import * as pages from "@/content/pages";
import { projectFacts } from "@/content/project";
import * as villaContent from "@/content/villas";

/* ------------------------------- Homepage ------------------------------- */

export async function getHeroContent() {
  return home.hero;
}

export async function getProjectOverview() {
  return home.overview;
}

export async function getVillaSection() {
  return { ...home.villaSection, villas: villaContent.villas };
}

export async function getAmenities() {
  return {
    ...home.amenitiesSection,
    items: amenityContent.amenities.filter((a) => a.featured),
  };
}

export async function getGalleryPreview(limit = 6) {
  const featured = galleryContent.gallery.filter((g) => g.featured && g.kind !== "video");
  return { ...home.gallerySection, images: featured.slice(0, limit) };
}

export async function getSiteVisitContent() {
  return { ...home.siteVisit, villaOptions: villaContent.villas.map((v) => v.name) };
}

export async function getSeoDescription() {
  return home.seoDescription;
}

/* -------------------------------- Villas -------------------------------- */

export async function getVillaModels() {
  return villaContent.villas;
}

export async function getVillaBySlug(slug: string) {
  return villaContent.villas.find((v) => v.slug === slug) ?? null;
}

export async function getVillaSlugs() {
  return villaContent.villas.map((v) => v.slug);
}

export async function getVillaSpecifications() {
  return {
    groups: villaContent.standardSpecifications,
    note: villaContent.specificationsNote,
    floorPlanNote: villaContent.floorPlanNote,
  };
}

export async function getVillasPageContent() {
  return pages.villasPage;
}

export async function getVillaDetailCopy() {
  return pages.villaDetailCopy;
}

/** Villa names accepted by the enquiry form (server-side whitelist). */
export async function getEnquiryVillaOptions() {
  return villaContent.villas.map((v) => v.name);
}

/* ------------------------------ Master plan ----------------------------- */

export async function getMasterPlanContent() {
  return { ...pages.masterPlanPage, plan: { ...pages.masterPlanPage.plan, ...masterPlan } };
}

export async function getProjectFacts() {
  return projectFacts;
}

/* ------------------------------- Amenities ------------------------------ */

export async function getAmenitiesPageContent() {
  const { hero, categories: categoriesIntro, cta } = pages.amenitiesPage;
  return {
    hero,
    categoriesIntro,
    cta,
    categories: amenityContent.amenityCategories,
    amenities: amenityContent.amenities,
    features: amenityContent.amenityFeatures,
  };
}

/* -------------------------------- Gallery ------------------------------- */

export async function getGalleryPageContent() {
  return {
    ...pages.galleryPage,
    categories: galleryContent.galleryCategories,
    items: galleryContent.gallery,
    notice: galleryContent.galleryNotice,
  };
}

/* ------------------------- Construction progress ------------------------ */

export async function getConstructionContent() {
  const [latest, ...earlier] = construction.constructionUpdates;
  return {
    ...pages.constructionPage,
    milestoneList: construction.constructionMilestones,
    latestUpdate: latest,
    earlierUpdates: earlier,
    notice: construction.constructionNotice,
  };
}

/* --------------------------------- About -------------------------------- */

export async function getAboutContent() {
  return { ...pages.aboutPage, company, facts: projectFacts };
}

/* -------------------------------- Contact ------------------------------- */

export async function getContactContent() {
  return { ...pages.contactPage, villaOptions: villaContent.villas.map((v) => ({ slug: v.slug, name: v.name, configuration: v.configuration })) };
}
