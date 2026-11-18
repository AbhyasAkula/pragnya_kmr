import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/config/site";
import type { ImageAsset, VillaModel } from "@/types/content";

if (!siteUrl && process.env.NODE_ENV === "production") {
  console.warn(
    "[seo] NEXT_PUBLIC_SITE_URL is not set: canonical URLs, sitemap entries and absolute " +
      "Open Graph URLs are omitted and pages are marked noindex. Set it before launch.",
  );
}

/** Next's own fallback; only used to resolve relative URLs locally. */
const LOCAL_ORIGIN = new URL("http://localhost:3000");

/**
 * Site-wide defaults for the root layout. Deliberately contains NO
 * page-specific fields (canonical, og:url): Next shallow-merges metadata, so
 * anything set here would be inherited by every route. Use `pageMetadata`.
 */
export function rootMetadata(description: string): Metadata {
  return {
    metadataBase: siteUrl ?? LOCAL_ORIGIN,
    title: {
      default: `${siteConfig.name} — Luxury Gated Villa Community in ${siteConfig.location.city}`,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords: [...siteConfig.keywords],
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.developer }],
    creator: siteConfig.developer,
    openGraph: openGraphDefaults(description),
    twitter: { card: "summary_large_image", title: siteConfig.name, description },
    robots: siteUrl ? { index: true, follow: true } : { index: false, follow: false },
    formatDetection: { telephone: true },
  };
}

function openGraphDefaults(description: string): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description,
  };
}

type PageMetadataInput = {
  /** Route path, e.g. "/" or "/villas". */
  path: `/${string}`;
  /** Omit on the homepage to use the root default title. */
  title?: string;
  description: string;
  /** Share image for Open Graph / Twitter cards. */
  image?: ImageAsset;
};

/**
 * Per-page metadata: canonical + og:url for THIS path only. Every page should
 * export `metadata = pageMetadata({...})` (or call it in generateMetadata).
 */
export function pageMetadata({ path, title, description, image }: PageMetadataInput): Metadata {
  const images = image ? [{ url: image.src, alt: image.alt }] : undefined;
  const openGraph = {
    ...openGraphDefaults(description),
    ...(title ? { title } : {}),
    ...(siteUrl ? { url: path } : {}),
    ...(images ? { images } : {}),
  };
  return {
    ...(title ? { title } : {}),
    description,
    ...(siteUrl ? { alternates: { canonical: path } } : {}),
    openGraph,
    ...(images
      ? { twitter: { card: "summary_large_image", title: title ?? siteConfig.name, description, images } }
      : {}),
  };
}

export type Crumb = { label: string; href: `/${string}` };

/** schema.org BreadcrumbList — only emitted when the production origin is known. */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  if (!siteUrl) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: absoluteUrl(c.href),
    })),
  };
}

/** schema.org description of a villa model (no price/offer: prices are placeholders). */
export function villaJsonLd(villa: VillaModel, path: `/${string}`) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "SingleFamilyResidence",
    ...(url ? { "@id": `${url}#residence`, url } : {}),
    name: `${villa.name} — ${siteConfig.name}`,
    description: villa.summary,
    image: villa.gallery.map((g) => g.src),
    numberOfRooms: villa.bedrooms,
    numberOfBathroomsTotal: villa.bathrooms,
    floorSize: { "@type": "QuantitativeValue", value: villa.builtUpArea, unitCode: "FTK" },
    containedInPlace: { "@type": "GatedResidenceCommunity", name: siteConfig.name },
  };
}

/** Serialises JSON-LD safely for a <script> tag. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Absolute URL for a path, or null when the production origin is unknown. */
export function absoluteUrl(path: `/${string}`): string | null {
  return siteUrl ? new URL(path, siteUrl).toString() : null;
}

/** schema.org structured data for the homepage. */
export function homeJsonLd(villas: VillaModel[], heroImage: string, description: string) {
  const { location, contact } = siteConfig;
  const home = absoluteUrl("/");
  const address = {
    "@type": "PostalAddress",
    streetAddress: location.street,
    addressLocality: location.city,
    addressRegion: location.region,
    postalCode: location.postalCode,
    addressCountry: location.country,
  };
  // Only emit URLs/ids when the real origin is configured.
  const withUrl = (fragment: string) => (home ? { "@id": `${home}#${fragment}`, url: home } : {});

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        ...withUrl("organization"),
        name: siteConfig.developer,
        telephone: contact.phone,
        email: contact.email,
        // sameAs is intentionally omitted until real social profile URLs exist.
      },
      {
        "@type": "GatedResidenceCommunity",
        ...withUrl("community"),
        name: siteConfig.name,
        description,
        image: heroImage,
        telephone: contact.phone,
        address,
        containsPlace: villas.map((v) => ({
          "@type": "SingleFamilyResidence",
          name: v.name,
          numberOfRooms: v.bedrooms,
          numberOfBathroomsTotal: v.bathrooms,
          floorSize: { "@type": "QuantitativeValue", value: v.builtUpArea, unitCode: "FTK" },
        })),
      },
    ],
  };
}
