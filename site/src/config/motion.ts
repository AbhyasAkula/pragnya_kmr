/** Shared motion tokens so every animation feels like one calm system. */
export const easeLuxe = [0.22, 1, 0.36, 1] as const;
/** Soft in-and-out curve for entrances (mirrors --ease-calm in globals.css). */
export const easeCalm = [0.33, 0, 0.2, 1] as const;

export const duration = {
  fast: 0.25,
  base: 0.5,
  slow: 0.9,
} as const;

/** Delay between items in a revealed group, and the cap so long lists never lag. */
export const stagger = 0.06;
export const maxStaggerDelay = 0.24;
