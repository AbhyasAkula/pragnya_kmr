/**
 * SAMPLE CONSTRUCTION DATA — illustrative only. Every update is flagged
 * `sample: true` and the page labels it as such. Replace with real site
 * reports (newest first) when construction data is provided; the page then
 * drops the sample labels automatically for updates with `sample: false`.
 */
import type { ConstructionMilestone, ConstructionUpdate } from "@/types/content";
import { images } from "./images";
import { projectFacts } from "./project";

export const constructionMilestones: ConstructionMilestone[] = [
  { id: "m-1", title: "Site mobilisation", status: "completed", date: "Mar 2026" },
  { id: "m-2", title: "Excavation & footings", status: "completed", date: "Jun 2026" },
  { id: "m-3", title: "Foundations — Phase I", status: "completed", date: "Sep 2026" },
  { id: "m-4", title: "Superstructure — Phase I villas", status: "in-progress", date: "Started Oct 2026" },
  { id: "m-5", title: "Clubhouse structure", status: "in-progress", date: "Started Nov 2026" },
  { id: "m-6", title: "Services & finishing works", status: "upcoming", date: "2027" },
  { id: "m-7", title: "Landscape & amenities", status: "upcoming", date: "2027" },
  { id: "m-8", title: "Phase I handover", status: "upcoming", date: `Target: ${projectFacts.possession}` },
];

/** Newest first. The first entry is featured as the latest update. */
export const constructionUpdates: ConstructionUpdate[] = [
  {
    id: "u-2026-11",
    date: "2026-11-10",
    title: "Phase I superstructure underway",
    summary:
      "Column and slab work continues across the first Magnolia and Cypress clusters, and the clubhouse structure has begun. Internal roads and underground utility trenches are progressing along the central spine.",
    overallProgress: 38,
    areas: [
      { label: "Phase I villas", progress: 45 },
      { label: "Clubhouse", progress: 30 },
      { label: "Roads & utilities", progress: 25 },
      { label: "Landscape", progress: 5 },
    ],
    media: [
      { id: "u4-1", src: images.constructionColumns, alt: "Workers fixing reinforcement for concrete columns", caption: "Column reinforcement, Phase I", source: "photo" },
      { id: "u4-2", src: images.constructionSlab, alt: "Reinforcement mesh laid for a floor slab", caption: "First-floor slab preparation", source: "photo" },
      { id: "u4-3", src: images.constructionServices, alt: "Technician installing electrical conduits", caption: "Services coordination", source: "photo" },
      {
        id: "u4-v",
        kind: "video",
        src: images.constructionSiteLayout,
        alt: "Aerial view of the site, used as the video cover",
        caption: "Monthly site walkthrough",
        source: "photo",
        video: {},
      },
    ],
    sample: true,
  },
  {
    id: "u-2026-09",
    date: "2026-09-08",
    title: "Foundations complete for Phase I",
    summary:
      "Foundations for all Phase I villa plots are complete and slab work has started on the first cluster. Trenching for underground utilities began along the main avenue.",
    overallProgress: 26,
    areas: [
      { label: "Phase I villas", progress: 28 },
      { label: "Clubhouse", progress: 15 },
      { label: "Roads & utilities", progress: 15 },
      { label: "Landscape", progress: 0 },
    ],
    media: [
      { id: "u3-1", src: images.constructionSlab, alt: "Reinforcement mesh laid for a floor slab", caption: "Ground-floor slab", source: "photo" },
      { id: "u3-2", src: images.constructionSiteLayout, alt: "Site team walking across a prepared foundation area", caption: "Foundation inspection", source: "photo" },
    ],
    sample: true,
  },
  {
    id: "u-2026-06",
    date: "2026-06-15",
    title: "Excavation and footings",
    summary: "Excavation for the Phase I precincts is complete and footing work is progressing plot by plot.",
    overallProgress: 14,
    areas: [
      { label: "Phase I villas", progress: 15 },
      { label: "Clubhouse", progress: 5 },
      { label: "Roads & utilities", progress: 8 },
      { label: "Landscape", progress: 0 },
    ],
    media: [
      { id: "u2-1", src: images.constructionEarthworks, alt: "Excavators levelling ground on a construction site", caption: "Earthworks", source: "photo" },
      { id: "u2-2", src: images.constructionSiteLayout, alt: "Aerial view of a construction site with marked foundations", caption: "Site layout", source: "photo" },
    ],
    sample: true,
  },
  {
    id: "u-2026-03",
    date: "2026-03-20",
    title: "Site mobilisation",
    summary: "The site office, boundary works and temporary access roads are in place, and earthworks have begun.",
    overallProgress: 5,
    areas: [
      { label: "Phase I villas", progress: 3 },
      { label: "Clubhouse", progress: 0 },
      { label: "Roads & utilities", progress: 5 },
      { label: "Landscape", progress: 0 },
    ],
    media: [
      { id: "u1-1", src: images.constructionEarthworks, alt: "Excavators levelling ground on a construction site", caption: "Earthworks begin", source: "photo" },
    ],
    sample: true,
  },
];

export const constructionNotice =
  "Sample updates for illustration only. Actual construction progress, dates and photographs will be published here once provided.";
