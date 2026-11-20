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
npm run db:migrate          # apply pending Prisma migrations (uses DIRECT_URL)
npm run db:migrate:status   # compare migrations with the database
npm run db:studio           # browse the database locally (never expose publicly)
npm run test:api            # integration tests against a running server + real DB (see below)
```

## Environment

Copy `.env.example` to `.env.local`. `NEXT_PUBLIC_SITE_URL` is the production origin (https). While it is
unset the site emits **no canonical URLs**, an empty sitemap and a `noindex` robots policy, so preview
builds are never indexed under a wrong domain. An invalid or non-https value fails the build.

## Site-visit bookings (backend)

The "Book a Site Visit" form (homepage, villa pages, `/contact`) posts JSON to **`POST /api/site-visit`**
(`src/app/api/site-visit/route.ts`), which stores the request in Supabase Postgres via Prisma 7.

- **Storage:** table `aurelia.site_visit_requests` (schema `prisma/schema.prisma`, migrations in
  `prisma/migrations/`). New requests are `NEW` — a request, never an auto-confirmed visit. Statuses:
  NEW, CONTACTED, CONFIRMED, COMPLETED, CANCELLED.
- **Privacy of the data:** tables live in the private `aurelia` schema, which Supabase's Data API does not
  expose; `anon`/`authenticated` have no privileges and RLS is enabled. Only server code
  (`src/lib/server/*`, guarded by `server-only`) touches the database. There is no endpoint that lists bookings.
- **Abuse protection:** same-origin check, JSON-only, 8 KB body cap, honeypot, server-side validation,
  Postgres-backed rate limits (per IP: 8/10 min and 30/day; per phone: 5/day; site-wide: 300/hour),
  idempotency key (retries never duplicate) and a partial unique index (one open request per phone per date).
- **Honest results:** success is shown only after the insert commits. Failures return 503 with the phone and
  WhatsApp fallback; entered data is kept. Logs record event names and error codes only, never personal data.
- **Kill switch:** `siteConfig.features.leadStorageConnected = false` makes the form say online booking is
  unavailable and the API refuse submissions.
- **Phase 3 (admin):** read and update leads through `src/lib/server/site-visits.ts`, behind authentication.

Environment: `DATABASE_URL` (pooler, transaction mode, port 6543), `DIRECT_URL` (pooler, session mode,
port 5432, `schema=aurelia`), `LEAD_HASH_SECRET`, and `DATABASE_SSL_CA` (recommended). See `.env.example`.

**Tests:** `npm run build && npx next start -p 3200`, then `BASE_URL=http://localhost:3200 npm run test:api`.
They write synthetic rows to the configured database and delete them afterwards. Optionally start a second
server with an unreachable `DATABASE_URL` and pass it as `FAILING_BASE_URL` to test the failure path.

## Structure

```
src/
  app/                    routes, root layout, globals.css (design tokens), sitemap, robots
  app/api/site-visit/     booking endpoint (POST only)
  components/
    layout/               navbar, footer
    sections/home/        homepage sections
    ui/                   reusable primitives (Button, Reveal, Counter, SectionHeading, Logo…)
    providers/            client providers (Motion reduced-motion config)
  config/                 site.ts (brand/contact/SEO), navigation, fonts, motion tokens
  content/                placeholder copy + image URLs
  lib/                    data access layer, SEO helpers, validation, utils
  lib/server/             server-only: Prisma client, lead storage, rate limiting, PII-safe logging
  generated/prisma/       generated Prisma client (git-ignored; created on install/build)
prisma/                   schema.prisma + SQL migrations
tests/                    API integration tests
  types/                  content models
```

## Where to change things

| What | File |
| --- | --- |
| Colours, fonts, spacing, easing | `src/app/globals.css` (`@theme`) and `src/config/fonts.ts` |
| Brand name, logo text, contact, address, RERA, socials | `src/config/site.ts` |
| Site URL | `NEXT_PUBLIC_SITE_URL` env var |
| Phone / WhatsApp / email | `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_WHATSAPP`, `NEXT_PUBLIC_CONTACT_EMAIL` (fallbacks in `src/config/site.ts`) |
| Company story, vision, values | `src/content/company.ts` |
| Gallery items | `src/content/gallery.ts` |
| Construction updates & milestones | `src/content/construction.ts` |
| Nav links | `src/config/navigation.ts` |
| Headline numbers (acres, clubhouse size…) | `src/content/project.ts` (villa count is derived from unit counts) |
| Homepage section copy, gallery | `src/content/home.ts` |
| Villa models, galleries, floor-plan levels, specifications | `src/content/villas.ts` |
| Amenities (full list, categories, feature bands) | `src/content/amenities.ts` |
| Master plan zones / approved plan image | `src/content/master-plan.ts` |
| Interior page heroes & section copy | `src/content/pages.ts` |
| Images | `src/content/images.ts` (and `images.remotePatterns` in `next.config.ts` if not self-hosted) |

## Pages

| Route | Notes |
| --- | --- |
| `/` | Homepage |
| `/villas` | Model cards + comparison table |
| `/villas/[slug]` | Prerendered per villa: gallery (lightbox), floor-plan tabs, specifications, enquiry form pre-selecting the villa |
| `/master-plan` | Zoomable plan + numbered legend, highlights, models by precinct |
| `/amenities` | Feature bands + categorised amenity cards |
| `/gallery` | Category filters (Villas, Interiors, Amenities, Community); every item labelled render or photo; video support |
| `/construction-progress` | Latest update featured, milestones, earlier updates with media — clearly labelled SAMPLE data |
| `/about` | Company story, vision, values, quality commitments (company data in `src/content/company.ts`) |
| `/contact` | WhatsApp (`wa.me`), Call (`tel:`), email, site office + form switcher. `?type=visit` selects the visit form; `&villa=<slug>` pre-selects a villa |

**Placeholders, by design:** floor plans render a labelled "Floor plan coming soon" frame until a level gets a
`drawing`; the master plan renders an abstract, watermarked zoning diagram until `masterPlan.drawing` is set.
Neither invents an architectural layout.

Set `NEXT_PUBLIC_SITE_URL` in production for correct canonical/OG/sitemap URLs.

## Backend / admin readiness

- Components receive data via async getters in `src/lib/data.ts`. Point these at a CMS, database or admin API without touching UI code.
- Content shapes live in `src/types/content.ts`.
- The site-visit form posts to `/api/site-visit`; leads are stored via `src/lib/server/site-visits.ts`. Validation is shared in `src/lib/validation/site-visit.ts`. Sales notifications (email/WhatsApp) are not built yet.
- `robots.ts` already disallows `/admin` and `/api`.
