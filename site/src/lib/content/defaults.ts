/**
 * Default value for every editable content section: the original placeholder
 * copy in src/content. Used to seed the database and as a fallback when a
 * section has never been saved. Never presented as verified business data.
 */
import { siteConfig } from "@/config/site";
import * as amenityContent from "@/content/amenities";
import { galleryNotice } from "@/content/gallery";
import * as home from "@/content/home";
import { masterPlan } from "@/content/master-plan";
import { projectFacts } from "@/content/project";
import * as villaContent from "@/content/villas";
import type { ContentKey, ContentValue } from "@/lib/validation/cms";

export const contentDefaults: { [K in ContentKey]: ContentValue<K> } = {
  "project.facts": projectFacts,
  "home.hero": home.hero,
  "home.overview": home.overview,
  "home.villaSection": home.villaSection,
  "home.amenitiesSection": home.amenitiesSection,
  "home.gallerySection": home.gallerySection,
  "home.siteVisit": home.siteVisit,
  amenities: {
    categories: amenityContent.amenityCategories,
    items: amenityContent.amenities,
    features: amenityContent.amenityFeatures,
  },
  masterPlan,
  "villas.specifications": {
    groups: villaContent.standardSpecifications,
    note: villaContent.specificationsNote,
    floorPlanNote: villaContent.floorPlanNote,
  },
  contact: {
    phone: siteConfig.contact.phone,
    whatsapp: siteConfig.contact.whatsapp,
    whatsappMessage: siteConfig.contact.whatsappMessage,
    email: siteConfig.contact.email,
    hours: siteConfig.contact.hours,
    street: siteConfig.location.street,
    city: siteConfig.location.city,
    region: siteConfig.location.region,
    postalCode: siteConfig.location.postalCode,
    mapUrl: siteConfig.location.mapUrl,
  },
  settings: {
    acceptingOnlineBookings: true,
    reraNumber: siteConfig.rera,
    privacyPolicyUrl: siteConfig.privacy.policyUrl,
  },
  "gallery.page": { notice: galleryNotice },
};
