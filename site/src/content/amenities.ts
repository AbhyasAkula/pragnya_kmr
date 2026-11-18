/**
 * PLACEHOLDER AMENITY DATA — fictional, for design purposes.
 * `featured` items (in this order) power the homepage preview; the full,
 * categorised list powers /amenities.
 */
import { formatNumber } from "@/lib/utils";
import type { Amenity, AmenityCategory, AmenityFeature } from "@/types/content";
import { images } from "./images";
import { projectFacts as facts } from "./project";

export const amenityCategories: AmenityCategory[] = [
  { id: "clubhouse", title: "Clubhouse & social", description: "Spaces to gather, celebrate and work, steps from home." },
  { id: "wellness", title: "Health & wellness", description: "Daily rituals of movement, recovery and calm." },
  { id: "aquatics", title: "Pools", description: "Water for laps, lounging and little ones." },
  { id: "sports", title: "Sports & recreation", description: "Courts and tracks for every age and pace." },
  { id: "family", title: "Family & community", description: "Thoughtful places for children, elders and pets." },
  { id: "outdoors", title: "Parks & landscape", description: "Green rooms, trails and lawns across the enclave." },
  { id: "services", title: "Security & services", description: "The quiet infrastructure behind everyday ease." },
];

export const amenities: Amenity[] = [
  // ---- Featured on the homepage (keep order) ----
  {
    id: "a-clubhouse",
    title: "Grand Clubhouse",
    description: `${formatNumber(facts.clubhouseSqFt)} sq ft with lounges, banquet hall and co-working suites.`,
    icon: "clubhouse",
    category: "clubhouse",
    featured: true,
  },
  {
    id: "a-pool",
    title: "Infinity Pool",
    description: "Temperature-controlled pool with a separate kids' pool.",
    icon: "pool",
    category: "aquatics",
    featured: true,
  },
  {
    id: "a-fitness",
    title: "Fitness Studio",
    description: "Fully equipped gym, yoga deck and aerobics room.",
    icon: "fitness",
    category: "wellness",
    featured: true,
  },
  {
    id: "a-spa",
    title: "Spa & Wellness",
    description: "Steam, sauna and treatment rooms for complete restoration.",
    icon: "spa",
    category: "wellness",
    featured: true,
  },
  {
    id: "a-courts",
    title: "Sports Courts",
    description: "Tennis, badminton and a half-basketball court.",
    icon: "courts",
    category: "sports",
    featured: true,
  },
  {
    id: "a-trails",
    title: "Jogging Trails",
    description: "2.4 km tree-lined trail looping the central park.",
    icon: "trails",
    category: "outdoors",
    featured: true,
  },
  {
    id: "a-kids",
    title: "Children's Play",
    description: "Themed play zones, sand pit and a supervised creche.",
    icon: "kids",
    category: "family",
    featured: true,
  },
  {
    id: "a-security",
    title: "24/7 Security",
    description: "Gated entry, CCTV surveillance and smart access control.",
    icon: "security",
    category: "services",
    featured: true,
  },

  // ---- Full list (amenities page) ----
  { id: "a-banquet", title: "Banquet Hall", description: "A pillar-free hall for celebrations, with a catering kitchen.", icon: "banquet", category: "clubhouse" },
  { id: "a-cowork", title: "Co-working Suites", description: "Quiet desks, meeting rooms and high-speed connectivity.", icon: "cowork", category: "clubhouse" },
  { id: "a-theatre", title: "Preview Theatre", description: "An intimate screening room for films and match nights.", icon: "theatre", category: "clubhouse" },
  { id: "a-cafe", title: "Café & Lounge", description: "All-day café with a terrace overlooking the pool.", icon: "cafe", category: "clubhouse" },
  { id: "a-yoga", title: "Yoga & Meditation Deck", description: "A shaded timber deck facing the central park.", icon: "yoga", category: "wellness" },
  { id: "a-sauna", title: "Steam & Sauna", description: "Separate steam and sauna suites with changing lounges.", icon: "sauna", category: "wellness" },
  { id: "a-cabanas", title: "Pool Deck & Cabanas", description: "Shaded cabanas and loungers around the main pool.", icon: "deck", category: "aquatics" },
  { id: "a-splash", title: "Kids' Splash Pool", description: "A shallow, supervised pool for younger swimmers.", icon: "pool", category: "aquatics" },
  { id: "a-cricket", title: "Cricket Practice Nets", description: "Two practice lanes with bowling machine provision.", icon: "cricket", category: "sports" },
  { id: "a-squash", title: "Squash Court", description: "A glass-backed court inside the clubhouse.", icon: "squash", category: "sports" },
  { id: "a-cycling", title: "Cycling Track", description: "A dedicated loop separated from vehicle roads.", icon: "cycling", category: "sports" },
  { id: "a-creche", title: "Creche", description: "A bright daycare room close to the play zones.", icon: "creche", category: "family" },
  { id: "a-seniors", title: "Senior Citizens' Court", description: "Shaded seating, gentle walking loops and a reading nook.", icon: "seniors", category: "family" },
  { id: "a-pets", title: "Pet Park", description: "A fenced run with agility play and wash station.", icon: "pets", category: "family" },
  { id: "a-amphitheatre", title: "Amphitheatre", description: "Open-air seating for festivals, performances and movie nights.", icon: "amphitheatre", category: "family" },
  { id: "a-park", title: "Central Park", description: "A landscaped green spine connecting every precinct.", icon: "park", category: "outdoors" },
  { id: "a-garden", title: "Butterfly Garden", description: "Native flowering plants that attract birds and butterflies.", icon: "garden", category: "outdoors" },
  { id: "a-barbecue", title: "Barbecue Lawn", description: "Grills and a lawn for relaxed weekend gatherings.", icon: "barbecue", category: "outdoors" },
  { id: "a-reflexology", title: "Reflexology Path", description: "A textured pebble walk within the wellness garden.", icon: "trails", category: "outdoors" },
  { id: "a-access", title: "Smart Access Control", description: "App-based visitor approvals and access-card entry.", icon: "access", category: "services" },
  { id: "a-ev", title: "EV Charging Points", description: "Shared charging bays near the clubhouse.", icon: "ev", category: "services" },
  { id: "a-parking", title: "Visitor Parking", description: "Dedicated guest bays so streets stay clear.", icon: "parking", category: "services" },
  { id: "a-estate", title: "Estate Management Office", description: "On-site team for maintenance, requests and upkeep.", icon: "estate", category: "services" },
];

/** Image + copy bands on the amenities page (alternating layout). */
export const amenityFeatures: AmenityFeature[] = [
  {
    id: "f-clubhouse",
    eyebrow: "The clubhouse",
    title: "A social heart for the whole community",
    description: `At ${formatNumber(facts.clubhouseSqFt)} sq ft, the clubhouse gathers lounges, a banquet hall, co-working suites and a café under one roof.`,
    points: ["Banquet hall with catering kitchen", "Co-working suites and meeting rooms", "Preview theatre and café terrace"],
    image: { src: images.amenityBanquet, alt: "Banquet hall laid with round tables beneath chandeliers" },
  },
  {
    id: "f-wellness",
    eyebrow: "Wellness",
    title: "Move, restore and recover",
    description: "A fully equipped fitness studio sits beside the spa, so a morning workout can end in the steam room.",
    points: ["Cardio and strength studio", "Spa treatment rooms", "Steam, sauna and yoga deck"],
    image: { src: images.amenityGym, alt: "Bright fitness studio with treadmills and strength equipment" },
  },
  {
    id: "f-sports",
    eyebrow: "Sports",
    title: "Courts for every game",
    description: "Tennis, badminton, squash and cricket nets keep competitive and casual players busy all year.",
    points: ["Tennis and badminton courts", "Glass-backed squash court", "Cricket practice nets"],
    image: { src: images.amenityTennis, alt: "Tennis player resting on a blue hard court with tennis balls" },
  },
  {
    id: "f-outdoors",
    eyebrow: "Landscape",
    title: "Green rooms between the homes",
    description: `With ${facts.openSpacePercent}% of the land kept open, gardens, lawns and shaded trails are never more than a short walk away.`,
    points: ["2.4 km tree-lined jogging trail", "Butterfly garden and reflexology path", "Central park and barbecue lawn"],
    image: { src: images.amenityGardenPath, alt: "Garden path lined with flowering hedges" },
  },
];
