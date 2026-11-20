/**
 * Cache tags for public content. Public getters are `"use cache"` with
 * these tags; admin actions call `updateTag()` after a successful write so
 * published changes appear on the site immediately, while pages otherwise
 * stay prerendered.
 */
export const TAGS = {
  villas: "villas",
  gallery: "gallery",
  construction: "construction",
  content: "content",
} as const;

export const contentTag = (key: string) => `content:${key}`;
