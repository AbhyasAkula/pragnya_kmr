import type { MetadataRoute } from "next";
import { getVillaSlugs } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes: { path: `/${string}`; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/villas", priority: 0.9 },
  { path: "/master-plan", priority: 0.8 },
  { path: "/amenities", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const villaRoutes = (await getVillaSlugs()).map((slug) => ({
    path: `/villas/${slug}` as const,
    priority: 0.8,
  }));
  // Without a configured origin there is nothing truthful to list.
  return [...staticRoutes, ...villaRoutes].flatMap(({ path, priority }) => {
    const url = absoluteUrl(path);
    return url ? [{ url, changeFrequency: "weekly" as const, priority }] : [];
  });
}
