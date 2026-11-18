/**
 * PLACEHOLDER VILLA DATA — fictional models for design purposes only.
 * Single source for every villa shown on the homepage, /villas,
 * /villas/[slug] and /master-plan.
 *
 * Floor plans list indicative rooms and areas only. No drawings are
 * included: the UI shows a clearly labelled placeholder until approved
 * architectural plans are supplied (set `drawing` on a level).
 */
import type { SpecificationGroup, VillaModel } from "@/types/content";
import { images } from "./images";

export const villas: VillaModel[] = [
  {
    id: "v-magnolia",
    slug: "the-magnolia",
    name: "The Magnolia",
    configuration: "3 BHK Villa",
    builtUpArea: 3200,
    plotArea: 267,
    bedrooms: 3,
    bathrooms: 4,
    floors: 2,
    carParks: 2,
    unitCount: 72,
    startingPrice: 34000000,
    status: "available",
    summary: "A compact, light-filled home with a private garden and rooftop terrace.",
    description: [
      "The Magnolia is planned for families who want the privacy of an independent home without excess. Living, dining and kitchen flow into one bright volume that opens onto a private garden.",
      "Upstairs, three generous bedrooms sit around a family lounge, while the terrace becomes an open-air room for evenings and weekends.",
    ],
    highlights: [
      "Private landscaped garden",
      "Rooftop terrace lounge",
      "Guest bedroom on the ground floor",
      "Cross-ventilated living spaces",
    ],
    image: {
      src: images.villaMagnolia,
      alt: "Modern villa facade with timber cladding and a landscaped front lawn",
    },
    gallery: [
      { id: "mg-1", src: images.villaMagnolia, alt: "Magnolia facade with timber cladding and lawn", caption: "Front elevation" },
      { id: "mg-2", src: images.exteriorTimberFacade, alt: "Two-storey villa with timber screen and gated driveway", caption: "Entrance court" },
      { id: "mg-3", src: images.livingArched, alt: "Living room with arched windows and exposed beams", caption: "Living room" },
      { id: "mg-4", src: images.bedroomMinimal, alt: "Bright bedroom with full-height glazing", caption: "Master suite" },
      { id: "mg-5", src: images.bathGlass, alt: "Bathroom with glass shower and double vanity", caption: "Master bath" },
    ],
    floorPlans: [
      {
        id: "ground",
        label: "Ground floor",
        area: 1450,
        rooms: ["Entrance foyer", "Living & dining", "Kitchen with utility", "Guest bedroom with en-suite", "Powder room", "Private garden"],
      },
      {
        id: "first",
        label: "First floor",
        area: 1350,
        rooms: ["Master suite with walk-in wardrobe", "Bedroom 2 with en-suite", "Family lounge", "Balcony"],
      },
      {
        id: "terrace",
        label: "Terrace",
        area: 400,
        rooms: ["Covered terrace lounge", "Open sky deck"],
      },
    ],
  },
  {
    id: "v-cypress",
    slug: "the-cypress",
    name: "The Cypress",
    configuration: "4 BHK Villa",
    builtUpArea: 4150,
    plotArea: 350,
    bedrooms: 4,
    bathrooms: 5,
    floors: 2,
    carParks: 2,
    unitCount: 78,
    startingPrice: 46000000,
    status: "limited",
    summary: "Cantilevered living spaces that open onto a lap pool and lawn.",
    description: [
      "The Cypress turns its living spaces towards a private lap pool and lawn, with a double-height foyer that sets the tone the moment you step in.",
      "A ground-floor guest suite keeps visiting family comfortable, while three en-suite bedrooms and a family lounge occupy the upper level.",
    ],
    highlights: [
      "Private lap pool and lawn",
      "Double-height entrance foyer",
      "Every bedroom with an en-suite bath",
      "Covered terrace with sky deck",
    ],
    image: {
      src: images.villaCypress,
      alt: "Contemporary villa with cantilevered upper floor above a lap pool",
    },
    gallery: [
      { id: "cy-1", src: images.villaCypress, alt: "Cypress villa with cantilevered upper floor above a lap pool", caption: "Pool elevation" },
      { id: "cy-2", src: images.exteriorWhitePool, alt: "White villa with a pool and sun loungers", caption: "Garden & pool" },
      { id: "cy-3", src: images.livingOpenPlan, alt: "Open-plan living room with timber feature wall", caption: "Living & dining" },
      { id: "cy-4", src: images.bedroomTimber, alt: "Bedroom with timber floors and full-height windows", caption: "Bedroom" },
      { id: "cy-5", src: images.bathStone, alt: "Stone-finish bathroom with freestanding tub", caption: "Master bath" },
    ],
    floorPlans: [
      {
        id: "ground",
        label: "Ground floor",
        area: 1900,
        rooms: ["Double-height foyer", "Living room opening to lap pool", "Dining", "Kitchen with utility", "Guest suite", "Powder room"],
      },
      {
        id: "first",
        label: "First floor",
        area: 1750,
        rooms: ["Master suite with dressing & bath", "Bedroom 3 with en-suite", "Bedroom 4 with en-suite", "Family lounge"],
      },
      {
        id: "terrace",
        label: "Terrace",
        area: 500,
        rooms: ["Covered terrace lounge", "Sky deck"],
      },
    ],
  },
  {
    id: "v-banyan",
    slug: "the-banyan",
    name: "The Banyan",
    configuration: "4 BHK + Study",
    builtUpArea: 5400,
    plotArea: 500,
    bedrooms: 4,
    bathrooms: 6,
    floors: 2,
    carParks: 3,
    unitCount: 36,
    startingPrice: 62000000,
    status: "available",
    summary: "The signature residence — double-height living, home theatre and pool.",
    description: [
      "The Banyan is the signature residence of the enclave: a double-height living hall, a show kitchen with a separate prep kitchen, and a pool deck framed by the garden.",
      "A private study, a home theatre and an entertainment terrace give every generation of the family a place of its own.",
    ],
    highlights: [
      "Double-height living hall",
      "Show kitchen and separate prep kitchen",
      "Home theatre and private study",
      "Pool deck and entertainment terrace",
    ],
    image: {
      src: images.villaBanyan,
      alt: "White signature villa with a reflective pool and timber-lined soffit",
    },
    gallery: [
      { id: "by-1", src: images.villaBanyan, alt: "Banyan villa with a reflective pool and timber-lined soffit", caption: "Signature elevation" },
      { id: "by-2", src: images.exteriorDusk, alt: "Dark-clad villa facade lit at dusk", caption: "Evening arrival" },
      { id: "by-3", src: images.overviewLiving, alt: "Double-height living room with an open timber staircase", caption: "Living hall" },
      { id: "by-4", src: images.stairPoolView, alt: "Glass-walled stair hall looking out to the pool", caption: "Stair & pool view" },
      { id: "by-5", src: images.galleryBedroom, alt: "Master bedroom with an upholstered headboard and bench", caption: "Master suite" },
    ],
    floorPlans: [
      {
        id: "ground",
        label: "Ground floor",
        area: 2300,
        rooms: ["Double-height living hall", "Formal dining", "Show kitchen & prep kitchen", "Guest suite", "Study", "Powder room", "Pool deck"],
      },
      {
        id: "first",
        label: "First floor",
        area: 2200,
        rooms: ["Master suite with dressing & bath", "Bedroom 3 with en-suite", "Bedroom 4 with en-suite", "Family lounge", "Home theatre"],
      },
      {
        id: "terrace",
        label: "Terrace",
        area: 900,
        rooms: ["Entertainment terrace", "Terrace pantry", "Terrace washroom"],
      },
    ],
  },
];

/** PLACEHOLDER — indicative finishes for design purposes, not a contractual specification. */
export const standardSpecifications: SpecificationGroup[] = [
  { id: "structure", title: "Structure", items: ["RCC framed structure", "Solid block masonry walls"] },
  {
    id: "flooring",
    title: "Flooring",
    items: ["Large-format vitrified tiles in living areas", "Engineered wood in the master bedroom", "Anti-skid tiles in bathrooms and balconies"],
  },
  { id: "kitchen", title: "Kitchen", items: ["Stone counter with stainless steel sink", "Provision for modular kitchen and appliances"] },
  { id: "bath", title: "Bathrooms", items: ["Premium sanitaryware and fittings", "Glass shower partition in the master bath"] },
  { id: "doors", title: "Doors & windows", items: ["Hardwood-frame main door", "Aluminium sliding windows with mosquito mesh"] },
  { id: "electrical", title: "Electrical", items: ["Concealed copper wiring", "Provision for air-conditioning in all bedrooms"] },
];

export const specificationsNote =
  "Indicative specifications for illustration only. Final specifications will be as per the sale agreement.";

export const floorPlanNote =
  "Floor plans are placeholders. Approved architectural drawings will be published here once available. Areas are indicative.";
