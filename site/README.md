# Aurelia Enclave — Website

Marketing site for a gated villa community. Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4 and Motion.

> All project details, prices, contact info and images are **placeholders**. Replace them before launch (see below).

## Scripts

```bash
npm run dev                 # local dev server
npm run build               # production build
npm run start               # serve the production build
npm run lint
npm run typecheck
npm run check:placeholders  # lists every placeholder still to replace; exits 1 until clean
```

## Environment

Copy `.env.example` to `.env.local`. `NEXT_PUBLIC_SITE_URL` is the production origin (https). While it is
unset the site emits **no canonical URLs**, an empty sitemap and a `noindex` robots policy, so preview
builds are never indexed under a wrong domain. An invalid or non-https value fails the build.

## Enquiry form (demo mode)

`siteConfig.features.leadStorageConnected` is `false`: the form validates input, then discards it and
tells the visitor plainly that nothing was sent, with the phone number to call. Connect storage in
`src/actions/site-visit.ts` (see `TODO(backend)`) — including rate limiting and bot protection — before
flipping the flag.

## Structure

```
src/
  app/                    routes, root layout, globals.css (design tokens), sitemap, robots
  actions/                server actions (site-visit enquiry)
  components/
    layout/               navbar, footer
    sections/home/        homepage sections
    ui/                   reusable primitives (Button, Reveal, Counter, SectionHeading, Logo…)
    providers/            client providers (Motion reduced-motion config)
  config/                 site.ts (brand/contact/SEO), navigation, fonts, motion tokens
  content/                placeholder copy + image URLs
  lib/                    data access layer, SEO helpers, validation, utils
  types/                  content models
```

## Where to change things

| What | File |
| --- | --- |
| Colours, fonts, spacing, easing | `src/app/globals.css` (`@theme`) and `src/config/fonts.ts` |
| Brand name, logo text, contact, address, RERA, socials | `src/config/site.ts` |
| Site URL | `NEXT_PUBLIC_SITE_URL` env var |
| Nav links | `src/config/navigation.ts` |
| Headline numbers (acres, clubhouse size…) | `src/content/project.ts` (villa count is derived from unit counts) |
| Homepage section copy, gallery | `src/content/home.ts` |
| Villa models, galleries, floor-plan levels, specifications | `src/content/villas.ts` |
| Amenities (full list, categories, feature bands) | `src/content/amenities.ts` |
| Master plan zones / approved plan image | `src/content/master-plan.ts` |
| Interior page heroes & section copy | `src/content/pages.ts` |

## Pages

| Route | Notes |
| --- | --- |
| `/` | Homepage |
| `/villas` | Model cards + comparison table |
| `/villas/[slug]` | Prerendered per villa: gallery (lightbox), floor-plan tabs, specifications, enquiry form pre-selecting the villa |
| `/master-plan` | Zoomable plan + numbered legend, highlights, models by precinct |
| `/amenities` | Feature bands + categorised amenity cards |

**Placeholders, by design:** floor plans render a labelled "Floor plan coming soon" frame until a level gets a
`drawing`; the master plan renders an abstract, watermarked zoning diagram until `masterPlan.drawing` is set.
Neither invents an architectural layout.
| Images | `src/content/images.ts` (and `images.remotePatterns` in `next.config.ts` if not self-hosted) |

Set `NEXT_PUBLIC_SITE_URL` in production for correct canonical/OG/sitemap URLs.

## Backend / admin readiness

- Components receive data via async getters in `src/lib/data.ts`. Point these at a CMS, database or admin API without touching UI code.
- Content shapes live in `src/types/content.ts`.
- The site-visit form posts to `src/actions/site-visit.ts`; the `TODO(backend)` marks where to persist leads and notify sales. Validation is shared in `src/lib/validation/site-visit.ts`.
- `robots.ts` already disallows `/admin` and `/api`.
