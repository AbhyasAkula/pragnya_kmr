"use client";

import type { ActionResult } from "@/lib/admin/action-result";
import { TOKEN_HELP } from "@/lib/content/tokens";
import type { ContentKey } from "@/lib/validation/cms";
import { StructuredForm, type FieldSpec, type FormSection } from "./structured-form";

/**
 * Editors built on <StructuredForm>. Field specs live here (client side)
 * because they include item factories; validation is on the server.
 */

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
type EditorProps = { action: Action; initial: Record<string, unknown>; hidden?: Record<string, string>; submitLabel?: string };

const tokenHint = (
  <>
    You can use placeholders that update automatically, e.g. <code className="rounded bg-sand px-1">{"{villaCount}"}</code>,{" "}
    <code className="rounded bg-sand px-1">{"{landAcres}"}</code>, <code className="rounded bg-sand px-1">{"{possession}"}</code>.{" "}
    <details className="mt-1 inline">
      <summary className="cursor-pointer font-medium text-ink">All placeholders</summary>
      <ul className="mt-1 grid gap-x-4 sm:grid-cols-2">
        {TOKEN_HELP.map((t) => (
          <li key={t.token}>
            <code className="rounded bg-sand px-1">{t.token}</code> {t.meaning}
          </li>
        ))}
      </ul>
    </details>
  </>
);

const sectionCopy = (withAccent = true): FieldSpec[] => [
  { kind: "text", name: "eyebrow", label: "Small heading (eyebrow)", width: "half", maxLength: 60 },
  { kind: "text", name: "title", label: "Heading", width: "half", maxLength: 120 },
  ...(withAccent ? [{ kind: "text", name: "accent", label: "Heading accent (shown in italic gold)", optional: true, maxLength: 120 } as FieldSpec] : []),
  { kind: "textarea", name: "description", label: "Introduction", optional: true, rows: 3, maxLength: 600, hint: tokenHint },
];

/* --------------------------------- villas --------------------------------- */

const villaSections: FormSection[] = [
  {
    title: "Basics",
    fields: [
      { kind: "text", name: "name", label: "Villa name", width: "half", maxLength: 80, placeholder: "The Magnolia" },
      {
        kind: "text",
        name: "slug",
        label: "Web address",
        width: "half",
        maxLength: 80,
        hint: "Lowercase words with dashes, e.g. the-magnolia → /villas/the-magnolia. Changing it breaks old links.",
      },
      { kind: "text", name: "configuration", label: "Configuration", width: "half", maxLength: 60, placeholder: "3 BHK Villa" },
      {
        kind: "select",
        name: "availability",
        label: "Availability",
        width: "half",
        options: [
          { value: "AVAILABLE", label: "Available" },
          { value: "LIMITED", label: "Limited availability" },
          { value: "SOLD_OUT", label: "Sold out" },
        ],
      },
      { kind: "textarea", name: "summary", label: "One-line summary", rows: 2, maxLength: 300 },
    ],
  },
  {
    title: "Key facts & price",
    description: "Figures are shown on the website exactly as entered. Prices are indicative starting prices.",
    fields: [
      { kind: "number", name: "startingPrice", label: "Starting price", width: "half", min: 0, suffix: "₹", hint: "Full amount in rupees, e.g. 34000000 for ₹3.4 Cr" },
      { kind: "number", name: "unitCount", label: "Homes of this model", width: "half", min: 0, hint: "Used for the total villa count across the site" },
      { kind: "number", name: "builtUpArea", label: "Built-up area", width: "third", min: 1, suffix: "sq ft" },
      { kind: "number", name: "plotArea", label: "Plot area", width: "third", min: 1, suffix: "sq yd" },
      { kind: "number", name: "floors", label: "Floors", width: "third", min: 1 },
      { kind: "number", name: "bedrooms", label: "Bedrooms", width: "third", min: 0 },
      { kind: "number", name: "bathrooms", label: "Bathrooms", width: "third", min: 0 },
      { kind: "number", name: "carParks", label: "Car parks", width: "third", min: 0 },
    ],
  },
  {
    title: "Description",
    fields: [
      { kind: "stringList", name: "description", label: "Paragraphs", itemLabel: "Paragraph", multiline: true, max: 6, maxLength: 1200 },
      { kind: "stringList", name: "highlights", label: "Highlights", itemLabel: "Highlight", max: 10, maxLength: 160, optional: true },
    ],
  },
  {
    title: "Images",
    fields: [
      { kind: "image", name: "image", label: "Main image", hint: "Shown on cards and as the page banner. Landscape, at least 2000 px wide." },
      {
        kind: "list",
        name: "gallery",
        label: "Villa gallery",
        itemLabel: "Photo",
        titleField: "caption",
        max: 24,
        optional: true,
        fields: [
          { kind: "image", name: "photo", label: "Image" },
          { kind: "text", name: "caption", label: "Caption", maxLength: 80 },
        ],
      },
    ],
  },
  {
    title: "Floor plans",
    description: "Without an approved drawing the website shows a clearly labelled placeholder for that level.",
    fields: [
      {
        kind: "list",
        name: "floorPlans",
        label: "Levels",
        itemLabel: "Level",
        titleField: "label",
        max: 6,
        optional: true,
        newItem: () => ({ label: "", area: null, rooms: [] }),
        fields: [
          { kind: "text", name: "label", label: "Level name", width: "half", maxLength: 40, placeholder: "Ground floor" },
          { kind: "number", name: "area", label: "Area", width: "half", min: 0, suffix: "sq ft" },
          { kind: "stringList", name: "rooms", label: "Rooms", itemLabel: "Room", max: 20, maxLength: 100 },
          { kind: "image", name: "drawing", label: "Approved drawing", optional: true, allowEmpty: true },
        ],
      },
    ],
  },
];

/** Villa gallery items are stored flat ({id, src, alt, caption}); the form nests the image. */
export function villaToForm(v: Record<string, unknown>) {
  const gallery = ((v.gallery as { id: string; src: string; alt: string; caption: string }[]) ?? []).map((g) => ({
    id: g.id,
    photo: { src: g.src, alt: g.alt },
    caption: g.caption,
  }));
  return { ...v, gallery };
}

export function VillaEditor({ action, initial, hidden, submitLabel }: EditorProps) {
  return <StructuredForm action={action} sections={villaSections} initial={villaToForm(initial)} hidden={hidden} submitLabel={submitLabel} />;
}

/* ------------------------------ construction ------------------------------ */

const updateSections: FormSection[] = [
  {
    title: "Update",
    fields: [
      { kind: "date", name: "date", label: "Date of the update", width: "half" },
      { kind: "number", name: "overallProgress", label: "Overall progress", width: "half", min: 0, max: 100, suffix: "%" },
      { kind: "text", name: "title", label: "Title", maxLength: 120, placeholder: "Phase I superstructure underway" },
      { kind: "textarea", name: "summary", label: "Summary", rows: 5, maxLength: 1500 },
      {
        kind: "checkbox",
        name: "isSample",
        label: "This is illustrative sample content",
        hint: "Sample updates are labelled “Sample” on the website. Untick for real site reports.",
      },
    ],
  },
  {
    title: "Progress by area",
    fields: [
      {
        kind: "list",
        name: "areas",
        label: "Areas",
        itemLabel: "Area",
        titleField: "label",
        max: 10,
        optional: true,
        newItem: () => ({ label: "", progress: 0 }),
        fields: [
          { kind: "text", name: "label", label: "Area", width: "half", maxLength: 60, placeholder: "Clubhouse" },
          { kind: "number", name: "progress", label: "Progress", width: "half", min: 0, max: 100, suffix: "%" },
        ],
      },
    ],
  },
  {
    title: "Photos",
    description: "The first photo is featured. Mark each as a real photograph or a render.",
    fields: [
      {
        kind: "list",
        name: "media",
        label: "Photos",
        itemLabel: "Photo",
        titleField: "caption",
        max: 20,
        optional: true,
        newItem: () => ({ source: "photo" }),
        fields: [
          { kind: "image", name: "photo", label: "Image" },
          { kind: "text", name: "caption", label: "Caption", width: "half", maxLength: 120 },
          {
            kind: "select",
            name: "source",
            label: "Type",
            width: "half",
            options: [
              { value: "photo", label: "Photograph" },
              { value: "render", label: "Render (artist's impression)" },
            ],
          },
        ],
      },
    ],
  },
];

export function updateToForm(u: Record<string, unknown>) {
  const media = ((u.media as { id: string; src: string; alt: string; caption: string; source: string; kind?: string }[]) ?? []).map((m) => ({
    id: m.id,
    photo: { src: m.src, alt: m.alt },
    caption: m.caption,
    source: m.source,
    ...(m.kind === "video" ? { kind: "video" } : {}),
  }));
  return { ...u, media };
}

export function ConstructionUpdateEditor({ action, initial, hidden, submitLabel }: EditorProps) {
  return <StructuredForm action={action} sections={updateSections} initial={updateToForm(initial)} hidden={hidden} submitLabel={submitLabel} />;
}

export function MilestonesEditor({ action, initial }: EditorProps) {
  return (
    <StructuredForm
      action={action}
      initial={initial}
      submitLabel="Save milestones"
      sections={[
        {
          title: "Milestones",
          description: "Shown as a timeline in this order. Hidden milestones stay saved but don't appear on the website.",
          fields: [
            {
              kind: "list",
              name: "milestones",
              label: "Milestones",
              itemLabel: "Milestone",
              titleField: "title",
              max: 40,
              newItem: () => ({ title: "", status: "UPCOMING", dateLabel: "", visible: true, id: "" }),
              fields: [
                { kind: "text", name: "title", label: "Milestone", width: "half", maxLength: 120 },
                { kind: "text", name: "dateLabel", label: "Date shown", width: "half", maxLength: 60, placeholder: "Mar 2026 or Target: Dec 2027" },
                {
                  kind: "select",
                  name: "status",
                  label: "Status",
                  width: "half",
                  options: [
                    { value: "COMPLETED", label: "Completed" },
                    { value: "IN_PROGRESS", label: "In progress" },
                    { value: "UPCOMING", label: "Upcoming" },
                  ],
                },
                { kind: "checkbox", name: "visible", label: "Show on website", width: "half" },
              ],
            },
          ],
        },
      ]}
    />
  );
}

/* --------------------------------- content -------------------------------- */

const amenityIconOptions = [
  "clubhouse", "pool", "fitness", "spa", "courts", "trails", "kids", "security", "banquet", "cowork", "theatre", "cafe", "yoga",
  "sauna", "deck", "cricket", "squash", "cycling", "creche", "seniors", "pets", "amphitheatre", "park", "garden", "barbecue",
  "access", "ev", "parking", "estate",
].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

const amenityCategoryOptions = [
  { value: "clubhouse", label: "Clubhouse & social" },
  { value: "wellness", label: "Health & wellness" },
  { value: "aquatics", label: "Pools" },
  { value: "sports", label: "Sports & recreation" },
  { value: "family", label: "Family & community" },
  { value: "outdoors", label: "Parks & landscape" },
  { value: "services", label: "Security & services" },
];

export const contentSections: Record<ContentKey, FormSection[]> = {
  "project.facts": [
    {
      title: "Project details",
      description: "Headline figures used across the website. The total number of villas is calculated from the published villas.",
      fields: [
        { kind: "number", name: "landAcres", label: "Land area", width: "third", min: 1, suffix: "acres" },
        { kind: "number", name: "openSpacePercent", label: "Open space", width: "third", min: 0, max: 100, suffix: "%" },
        { kind: "number", name: "clubhouseSqFt", label: "Clubhouse area", width: "third", min: 0, suffix: "sq ft" },
        { kind: "number", name: "amenityCount", label: "Number of amenities", width: "third", min: 0 },
        { kind: "text", name: "configurations", label: "Configurations", width: "third", maxLength: 40, placeholder: "3 & 4 BHK" },
        { kind: "text", name: "possession", label: "Possession", width: "third", maxLength: 40, placeholder: "December 2027" },
        { kind: "text", name: "phaseLabel", label: "Phase label", width: "half", maxLength: 60, placeholder: "Phase I · Now open" },
        { kind: "text", name: "reraStatus", label: "RERA status label", width: "half", maxLength: 40, hint: "Must match the actual registration status." },
      ],
    },
  ],
  "home.hero": [
    {
      title: "Homepage banner",
      fields: [
        { kind: "text", name: "eyebrow", label: "Small heading (eyebrow)", maxLength: 80 },
        { kind: "text", name: "title", label: "Heading", width: "half", maxLength: 80 },
        { kind: "text", name: "titleAccent", label: "Heading accent (italic gold)", width: "half", maxLength: 80 },
        { kind: "textarea", name: "subtitle", label: "Subtitle", rows: 3, maxLength: 400, hint: tokenHint },
        {
          kind: "group",
          name: "secondaryCta",
          label: "Secondary button",
          fields: [
            { kind: "text", name: "label", label: "Button text", width: "half", maxLength: 40 },
            { kind: "text", name: "href", label: "Link", width: "half", maxLength: 300, hint: "A site path like /villas or an https:// link" },
          ],
        },
        { kind: "image", name: "image", label: "Banner image", hint: "Large landscape image; text sits on its left side." },
      ],
    },
  ],
  "home.overview": [
    {
      title: "Project overview",
      fields: [
        { kind: "text", name: "eyebrow", label: "Small heading (eyebrow)", width: "half", maxLength: 60 },
        { kind: "text", name: "badge", label: "Badge", width: "half", maxLength: 60 },
        { kind: "text", name: "title", label: "Heading", maxLength: 120 },
        { kind: "stringList", name: "paragraphs", label: "Paragraphs", itemLabel: "Paragraph", multiline: true, max: 6, maxLength: 800, hint: tokenHint },
        { kind: "stringList", name: "highlights", label: "Highlights", itemLabel: "Highlight", max: 10, maxLength: 160 },
        {
          kind: "group",
          name: "images",
          label: "Images",
          fields: [
            { kind: "image", name: "primary", label: "Main image" },
            { kind: "image", name: "secondary", label: "Second image" },
          ],
        },
      ],
    },
  ],
  "home.villaSection": [
    {
      title: "Villa collection section",
      fields: [
        ...sectionCopy(),
        { kind: "text", name: "ctaLabel", label: "Button text", width: "half", maxLength: 40 },
        { kind: "textarea", name: "priceNote", label: "Price note", rows: 2, maxLength: 300 },
      ],
    },
  ],
  "home.amenitiesSection": [
    {
      title: "Amenities section",
      fields: [
        ...sectionCopy(),
        { kind: "image", name: "featureImage", label: "Feature image" },
        { kind: "text", name: "featureCaption", label: "Image caption", maxLength: 80 },
      ],
    },
  ],
  "home.gallerySection": [{ title: "Gallery section", fields: sectionCopy() }],
  "home.siteVisit": [
    {
      title: "Site-visit section",
      fields: [
        ...sectionCopy(false),
        { kind: "image", name: "image", label: "Background image" },
        { kind: "text", name: "formTitle", label: "Form title", width: "half", maxLength: 80 },
        { kind: "text", name: "formSubtitle", label: "Form subtitle", width: "half", maxLength: 160 },
        {
          kind: "list",
          name: "perks",
          label: "Selling points",
          itemLabel: "Point",
          titleField: "text",
          max: 3,
          optional: true,
          newItem: () => ({ icon: "sparkles", text: "" }),
          fields: [
            {
              kind: "select",
              name: "icon",
              label: "Icon",
              width: "third",
              options: [
                { value: "car", label: "Car" },
                { value: "sparkles", label: "Sparkle" },
                { value: "calendar", label: "Calendar" },
              ],
            },
            { kind: "text", name: "text", label: "Text", width: "full", maxLength: 80 },
          ],
        },
      ],
    },
  ],
  amenities: [
    {
      title: "Amenities",
      description: "The full list on /amenities. Tick “Show on homepage” for the homepage preview (in this order).",
      fields: [
        {
          kind: "list",
          name: "items",
          label: "Amenities",
          itemLabel: "Amenity",
          titleField: "title",
          max: 80,
          newItem: () => ({ title: "", description: "", icon: "park", category: "outdoors", featured: false }),
          fields: [
            { kind: "text", name: "title", label: "Name", width: "half", maxLength: 60 },
            { kind: "select", name: "category", label: "Category", width: "half", options: amenityCategoryOptions },
            { kind: "textarea", name: "description", label: "Description", rows: 2, maxLength: 200, hint: tokenHint },
            { kind: "select", name: "icon", label: "Icon", width: "half", options: amenityIconOptions },
            { kind: "checkbox", name: "featured", label: "Show on homepage", width: "half" },
          ],
        },
      ],
    },
    {
      title: "Categories",
      fields: [
        {
          kind: "list",
          name: "categories",
          label: "Categories",
          itemLabel: "Category",
          titleField: "title",
          fixedLength: true,
          fields: [
            { kind: "text", name: "title", label: "Title", width: "half", maxLength: 60 },
            { kind: "text", name: "description", label: "Description", width: "half", maxLength: 200 },
          ],
        },
      ],
    },
    {
      title: "Feature bands",
      description: "Large image + text sections on the amenities page.",
      fields: [
        {
          kind: "list",
          name: "features",
          label: "Feature bands",
          itemLabel: "Band",
          titleField: "title",
          max: 8,
          optional: true,
          newItem: () => ({ eyebrow: "", title: "", description: "", points: [] }),
          fields: [
            { kind: "text", name: "eyebrow", label: "Small heading", width: "half", maxLength: 40 },
            { kind: "text", name: "title", label: "Heading", width: "half", maxLength: 120 },
            { kind: "textarea", name: "description", label: "Text", rows: 3, maxLength: 600 },
            { kind: "stringList", name: "points", label: "Points", itemLabel: "Point", max: 6, maxLength: 120 },
            { kind: "image", name: "image", label: "Image" },
          ],
        },
      ],
    },
  ],
  masterPlan: [
    {
      title: "Approved master plan",
      description: "Upload the approved master plan to replace the placeholder diagram on /master-plan.",
      fields: [
        { kind: "image", name: "drawing", label: "Approved master plan image", optional: true, allowEmpty: true },
        { kind: "textarea", name: "disclaimer", label: "Disclaimer shown under the plan", rows: 3, maxLength: 400 },
      ],
    },
    {
      title: "Zones",
      description: "Text for the numbered zones. Zone shapes belong to the diagram and aren't edited here.",
      fields: [
        {
          kind: "list",
          name: "zones",
          label: "Zones",
          itemLabel: "Zone",
          titleField: "label",
          fixedLength: true,
          fields: [
            { kind: "text", name: "label", label: "Name", width: "half", maxLength: 60 },
            { kind: "text", name: "villaSlug", label: "Linked villa (web address)", width: "half", maxLength: 80, optional: true, hint: "e.g. the-magnolia. Leave empty for no link." },
            { kind: "textarea", name: "description", label: "Description", rows: 2, maxLength: 200, hint: tokenHint },
          ],
        },
      ],
    },
  ],
  "villas.specifications": [
    {
      title: "Specifications",
      description: "Shared by every villa page.",
      fields: [
        {
          kind: "list",
          name: "groups",
          label: "Groups",
          itemLabel: "Group",
          titleField: "title",
          max: 12,
          newItem: () => ({ title: "", items: [""] }),
          fields: [
            { kind: "text", name: "title", label: "Group", maxLength: 60, placeholder: "Flooring" },
            { kind: "stringList", name: "items", label: "Items", itemLabel: "Item", max: 12, maxLength: 200 },
          ],
        },
        { kind: "textarea", name: "note", label: "Specifications note", rows: 2, maxLength: 400 },
        { kind: "textarea", name: "floorPlanNote", label: "Floor plan note", rows: 2, maxLength: 400 },
      ],
    },
  ],
  contact: [
    {
      title: "Contact details",
      description: "Used across the website: header, footer, contact page, booking form and WhatsApp links.",
      fields: [
        { kind: "text", name: "phone", label: "Sales phone", width: "half", maxLength: 20, inputMode: "tel", placeholder: "+91 98765 43210" },
        { kind: "text", name: "whatsapp", label: "WhatsApp number", width: "half", maxLength: 15, inputMode: "tel", hint: "Digits only with country code, e.g. 919876543210" },
        { kind: "textarea", name: "whatsappMessage", label: "Pre-filled WhatsApp message", rows: 2, maxLength: 300 },
        { kind: "text", name: "email", label: "Sales email", width: "half", maxLength: 254, inputMode: "email" },
        { kind: "text", name: "hours", label: "Office hours", width: "half", maxLength: 120 },
        { kind: "text", name: "street", label: "Street address", maxLength: 160 },
        { kind: "text", name: "city", label: "City", width: "third", maxLength: 60 },
        { kind: "text", name: "region", label: "State", width: "third", maxLength: 60 },
        { kind: "text", name: "postalCode", label: "PIN code", width: "third", maxLength: 12 },
        { kind: "text", name: "mapUrl", label: "Map link", maxLength: 500, inputMode: "url", hint: "Google Maps share link (https://…)" },
      ],
    },
  ],
  settings: [
    {
      title: "Online bookings",
      fields: [
        {
          kind: "checkbox",
          name: "acceptingOnlineBookings",
          label: "Accept site-visit requests through the website",
          hint: "When off, the booking form tells visitors to call or WhatsApp instead, and the booking API refuses requests.",
        },
      ],
    },
    {
      title: "Legal",
      fields: [
        { kind: "text", name: "reraNumber", label: "RERA registration number", width: "half", maxLength: 40, hint: "Shown in the website footer. Must be the real number." },
        {
          kind: "text",
          name: "privacyPolicyUrl",
          label: "Privacy policy link",
          width: "half",
          maxLength: 300,
          optional: true,
          hint: "The client's published, legally reviewed policy. Leave empty until it exists — the form then shows no link.",
        },
      ],
    },
  ],
  "gallery.page": [
    {
      title: "Gallery page notice",
      fields: [
        {
          kind: "textarea",
          name: "notice",
          label: "Notice shown above the gallery",
          rows: 3,
          maxLength: 400,
          optional: true,
          hint: "Leave empty to hide it, e.g. once all placeholder images are replaced with your own.",
        },
      ],
    },
  ],
};

/** Image fields store {src, alt}; nested images in lists already match the schema. */
export function ContentEditor({ contentKey, action, initial, hidden }: EditorProps & { contentKey: ContentKey }) {
  return <StructuredForm action={action} sections={contentSections[contentKey]} initial={initial} hidden={{ ...hidden, key: contentKey }} />;
}

/* --------------------------------- gallery -------------------------------- */

const gallerySections: FormSection[] = [
  {
    title: "Image",
    fields: [
      { kind: "image", name: "image", label: "Image" },
      { kind: "text", name: "caption", label: "Caption", maxLength: 120 },
      {
        kind: "select",
        name: "category",
        label: "Category",
        width: "half",
        options: [
          { value: "VILLAS", label: "Villas" },
          { value: "INTERIORS", label: "Interiors" },
          { value: "AMENITIES", label: "Amenities" },
          { value: "COMMUNITY", label: "Community" },
        ],
      },
      {
        kind: "select",
        name: "source",
        label: "Type",
        width: "half",
        hint: "Always shown to visitors so renders and real photos are never confused.",
        options: [
          { value: "PHOTO", label: "Photograph (real place)" },
          { value: "RENDER", label: "Render (artist's impression)" },
        ],
      },
      { kind: "checkbox", name: "featured", label: "Show in the homepage gallery preview", hint: "The first six starred images (in gallery order) are shown." },
    ],
  },
  {
    title: "Video",
    description: "For a film, the image above is used as the cover.",
    fields: [
      {
        kind: "select",
        name: "kind",
        label: "This item is",
        width: "half",
        options: [
          { value: "IMAGE", label: "An image" },
          { value: "VIDEO", label: "A video" },
        ],
      },
      { kind: "text", name: "videoDuration", label: "Video length", width: "half", optional: true, maxLength: 16, placeholder: "2:30" },
      {
        kind: "text",
        name: "videoUrl",
        label: "Video file link",
        optional: true,
        maxLength: 600,
        inputMode: "url",
        hint: "An https:// link to an MP4 file. Leave empty to show a labelled “coming soon” tile.",
      },
    ],
  },
];

export function GalleryItemEditor({ action, initial, hidden }: EditorProps) {
  return <StructuredForm action={action} sections={gallerySections} initial={initial} hidden={hidden} />;
}
