import type { ContentKey } from "@/lib/validation/cms";
import type { Permission } from "./permissions";

/** Which permission edits which content section, and how it is named in the UI. */
export const contentPermission: Record<ContentKey, Permission> = {
  "project.facts": "CONTENT",
  "home.hero": "CONTENT",
  "home.overview": "CONTENT",
  "home.villaSection": "CONTENT",
  "home.amenitiesSection": "CONTENT",
  "home.gallerySection": "CONTENT",
  "home.siteVisit": "CONTENT",
  amenities: "CONTENT",
  masterPlan: "CONTENT",
  contact: "CONTENT",
  "villas.specifications": "VILLAS",
  settings: "SETTINGS",
  "gallery.page": "GALLERY",
};

export const contentTitles: Record<ContentKey, string> = {
  "project.facts": "Project details",
  "home.hero": "Homepage banner",
  "home.overview": "Project overview",
  "home.villaSection": "Villa collection section",
  "home.amenitiesSection": "Amenities section",
  "home.gallerySection": "Gallery section",
  "home.siteVisit": "Site-visit section",
  amenities: "Amenities",
  masterPlan: "Master plan",
  contact: "Contact details",
  "villas.specifications": "Villa specifications",
  settings: "Settings",
  "gallery.page": "Gallery page notice",
};

/** Content index: sections editable under Content, grouped for the overview page. */
export const contentGroups: { title: string; description: string; items: { key: ContentKey; slug: string; description: string; publicPath: string }[] }[] = [
  {
    title: "Homepage",
    description: "Sections of the homepage, top to bottom.",
    items: [
      { key: "home.hero", slug: "homepage-banner", description: "Heading, subtitle, banner image and button.", publicPath: "/" },
      { key: "home.overview", slug: "project-overview", description: "Introduction, highlights and two images.", publicPath: "/" },
      { key: "home.villaSection", slug: "villa-section", description: "Heading and price note above the villa cards.", publicPath: "/#villas" },
      { key: "home.amenitiesSection", slug: "amenities-section", description: "Heading, feature image and caption.", publicPath: "/" },
      { key: "home.gallerySection", slug: "gallery-section", description: "Heading above the gallery preview.", publicPath: "/" },
      { key: "home.siteVisit", slug: "site-visit-section", description: "Booking section heading, image and selling points.", publicPath: "/" },
    ],
  },
  {
    title: "Project",
    description: "Facts and pages about the community.",
    items: [
      { key: "project.facts", slug: "project-details", description: "Acreage, clubhouse size, possession date and other headline facts.", publicPath: "/" },
      { key: "amenities", slug: "amenities", description: "Amenity list, categories and feature bands.", publicPath: "/amenities" },
      { key: "masterPlan", slug: "master-plan", description: "Approved plan image, zone names and disclaimer.", publicPath: "/master-plan" },
      { key: "contact", slug: "contact-details", description: "Phone, WhatsApp, email, address, hours and map link.", publicPath: "/contact" },
    ],
  },
];

export const contentBySlug = Object.fromEntries(contentGroups.flatMap((g) => g.items).map((i) => [i.slug, i])) as Record<
  string,
  (typeof contentGroups)[number]["items"][number]
>;
