/**
 * PLACEHOLDER GALLERY — stock imagery standing in for the developer's own
 * renders and photographs. Every item declares whether it represents an
 * architectural render or a real photograph, and that label is always shown.
 *
 * `featured` items (in this order) form the homepage preview.
 * Videos without `video.src` render as a clearly labelled "coming soon" tile.
 */
import type { GalleryCategory, GalleryImage } from "@/types/content";
import { images } from "./images";

export const galleryCategories: { id: GalleryCategory; label: string }[] = [
  { id: "villas", label: "Villas" },
  { id: "interiors", label: "Interiors" },
  { id: "amenities", label: "Amenities" },
  { id: "community", label: "Community" },
];

export const gallery: GalleryImage[] = [
  // ---- Homepage preview (keep order) ----
  { id: "g-1", src: images.galleryWhiteVilla, alt: "White minimalist villa with glass walls beside a pool", caption: "Poolside living", category: "villas", source: "render", featured: true },
  { id: "g-2", src: images.galleryLounge, alt: "Sunlit lounge with leather sofas and a gallery wall", caption: "Family lounge", category: "interiors", source: "render", featured: true },
  { id: "g-3", src: images.galleryCourtyard, alt: "Courtyard pool framed by arched verandas at night", caption: "Evening courtyard", category: "community", source: "render", featured: true },
  { id: "g-4", src: images.galleryBedroom, alt: "Master bedroom with an upholstered headboard and bench", caption: "Master suite", category: "interiors", source: "render", featured: true },
  { id: "g-5", src: images.galleryTerrace, alt: "Three-storey villa with glass balustrades and a large pool", caption: "Signature terraces", category: "villas", source: "render", featured: true },
  { id: "g-6", src: images.galleryVeranda, alt: "Colonial-style villa with a wraparound veranda and palms", caption: "Garden veranda", category: "villas", source: "render", featured: true },

  // ---- Full gallery ----
  { id: "g-7", src: images.villaMagnolia, alt: "Magnolia villa facade with timber cladding and a front lawn", caption: "The Magnolia", category: "villas", source: "render" },
  { id: "g-8", src: images.villaCypress, alt: "Cypress villa with a cantilevered upper floor above a lap pool", caption: "The Cypress", category: "villas", source: "render" },
  { id: "g-9", src: images.villaBanyan, alt: "Banyan villa with a reflective pool and timber-lined soffit", caption: "The Banyan", category: "villas", source: "render" },
  { id: "g-10", src: images.livingOpenPlan, alt: "Open-plan living room with a timber feature wall", caption: "Show villa living room", category: "interiors", source: "photo" },
  { id: "g-11", src: images.bedroomTimber, alt: "Bedroom with timber floors and full-height windows", caption: "Show villa bedroom", category: "interiors", source: "photo" },
  { id: "g-12", src: images.bathStone, alt: "Stone-finish bathroom with a freestanding tub", caption: "Master bath", category: "interiors", source: "render" },
  {
    id: "v-2",
    kind: "video",
    src: images.livingArched,
    alt: "Living room with arched windows, used as the video cover",
    caption: "Show villa tour",
    category: "interiors",
    source: "photo",
    video: {},
  },
  { id: "g-13", src: images.amenityResortDeck, alt: "Resort-style pool deck with loungers under a timber pavilion", caption: "Clubhouse pool deck", category: "amenities", source: "render" },
  { id: "g-14", src: images.amenityPool, alt: "Infinity pool lined with cabanas at dusk", caption: "Infinity pool", category: "amenities", source: "render" },
  { id: "g-15", src: images.amenityBanquet, alt: "Banquet hall with round tables beneath chandeliers", caption: "Banquet hall", category: "amenities", source: "render" },
  { id: "g-16", src: images.amenityGym, alt: "Fitness studio with treadmills and strength equipment", caption: "Fitness studio", category: "amenities", source: "render" },
  { id: "g-17", src: images.exteriorTimberFacade, alt: "Villa with timber screens behind a gated driveway", caption: "Entrance court", category: "community", source: "render" },
  { id: "g-18", src: images.amenityGardenPath, alt: "Garden path lined with flowering hedges", caption: "Garden walk", category: "community", source: "photo" },
  { id: "g-19", src: images.amenityForestTrail, alt: "Tree-lined trail through tall woodland", caption: "Woodland trail nearby", category: "community", source: "photo" },
  {
    id: "v-1",
    kind: "video",
    src: images.heroDusk,
    alt: "Contemporary villa at dusk, used as the video cover",
    caption: "Community walkthrough film",
    category: "community",
    source: "render",
    video: {},
  },
];

export const galleryNotice =
  "Sample images: these placeholders will be replaced with the developer's own renders and photographs. Renders are artist's impressions; photographs show actual places.";
