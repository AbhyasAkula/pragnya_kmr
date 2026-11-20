#!/usr/bin/env node
/**
 * Launch-readiness check: lists every placeholder still in use.
 * Exits with code 1 while any remain. Run with `npm run check:placeholders`.
 *
 * Website content is managed in the admin dashboard (database), so this
 * checks the LIVE values in the database (via DIRECT_URL in .env.local) as
 * well as the few files that still hold copy in code.
 *
 * It only REPORTS — it never invents replacement values.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";

const root = fileURLToPath(new URL("..", import.meta.url));
config({ path: [join(root, ".env.local"), join(root, ".env")], quiet: true });

const findings = [];

/* --------------------------- copy still in code --------------------------- */
// Interior page heroes and company story are code-managed; everything else is in the database.
const codeFiles = ["src/config/site.ts", "src/content/pages.ts", "src/content/company.ts"];
const markers = [
  { re: /PLACEHOLDER/, why: "marked placeholder" },
  { re: /example\.com/, why: "example.com address" },
  { re: /leadStorageConnected:\s*false/, why: "online booking disabled in code" },
];
for (const file of codeFiles) {
  readFileSync(join(root, file), "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      const hit = markers.find((m) => m.re.test(line));
      if (hit) findings.push(`${file}:${i + 1}  ${hit.why}  →  ${line.trim().slice(0, 100)}`);
    });
}
const pagesSrc = readFileSync(join(root, "src/content/pages.ts"), "utf8");
if (/images\.\w+/.test(pagesSrc)) findings.push("src/content/pages.ts  page banner images still use stock placeholders (src/content/images.ts)");

/* ------------------------------ environment ------------------------------ */
if (!process.env.NEXT_PUBLIC_SITE_URL) findings.push("env  NEXT_PUBLIC_SITE_URL is not set (site will be noindex, no canonical URLs)");
if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) findings.push("env  Supabase publishable key not set (admin sign-in disabled)");
if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) findings.push("env  SUPABASE_SECRET_KEY not set (invitations and uploads disabled)");
if (!process.env.DATABASE_SSL_CA) findings.push("env  DATABASE_SSL_CA not set (database TLS encrypted but certificate not verified)");

/* ------------------------ live content (database) ------------------------ */
if (process.env.DIRECT_URL) {
  const url = new URL(process.env.DIRECT_URL);
  for (const p of ["sslmode", "schema"]) url.searchParams.delete(p);
  const db = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
  try {
    await db.connect();
    const content = Object.fromEntries((await db.query("SELECT key, data FROM aurelia.content_entries")).rows.map((r) => [r.key, r.data]));
    const c = content.contact ?? {};
    if (/90000 00000/.test(c.phone ?? "")) findings.push("Content → Contact details  phone is the placeholder +91 90000 00000");
    if (/example\.com/.test(c.email ?? "")) findings.push("Content → Contact details  email is a placeholder (example.com)");
    if (/Survey No\. 000|^500000$/.test(`${c.street ?? ""}`) || c.postalCode === "500000") findings.push("Content → Contact details  address / PIN code are placeholders");
    if (c.mapUrl === "https://maps.google.com/?q=Hyderabad") findings.push("Content → Contact details  map link is a generic placeholder");
    const s = content.settings ?? {};
    if (/^P0240{6,}$/.test(s.reraNumber ?? "")) findings.push("Settings  RERA number is a placeholder");
    if (!s.privacyPolicyUrl) findings.push("Settings  no privacy policy link (client's legally reviewed policy required)");
    if (!content.masterPlan?.drawing) findings.push("Content → Master plan  placeholder diagram shown (upload the approved master plan)");
    const stockSections = Object.entries(content).filter(([, d]) => JSON.stringify(d).includes("images.unsplash.com")).map(([k]) => k);
    if (stockSections.length) findings.push(`Content  stock placeholder images in: ${stockSections.join(", ")}`);

    const villas = (await db.query("SELECT name, image, gallery, floor_plans FROM aurelia.villas WHERE status = 'PUBLISHED'")).rows;
    for (const v of villas) {
      const missing = (v.floor_plans ?? []).filter((l) => !l.drawing).length;
      if (missing) findings.push(`Villas → ${v.name}  ${missing} floor-plan level(s) without an approved drawing`);
      if (JSON.stringify([v.image, v.gallery]).includes("images.unsplash.com")) findings.push(`Villas → ${v.name}  uses stock placeholder images`);
    }
    const stockGallery = (await db.query("SELECT count(*)::int AS n FROM aurelia.gallery_items WHERE status = 'PUBLISHED' AND src LIKE 'https://images.unsplash.com/%'")).rows[0].n;
    if (stockGallery) findings.push(`Gallery  ${stockGallery} published image(s) are stock placeholders`);
    const samples = (await db.query("SELECT count(*)::int AS n FROM aurelia.construction_updates WHERE status = 'PUBLISHED' AND is_sample")).rows[0].n;
    if (samples) findings.push(`Construction  ${samples} SAMPLE update(s) still published`);
    const owners = (await db.query("SELECT count(*)::int AS n FROM aurelia.staff_members WHERE role = 'OWNER' AND status = 'ACTIVE'")).rows[0].n;
    if (!owners) findings.push("Staff  no active owner account yet (run npm run admin:create-owner)");
  } catch (e) {
    findings.push(`database  could not be checked (${e.message})`);
  } finally {
    await db.end().catch(() => undefined);
  }
} else {
  findings.push("database  DIRECT_URL not set — live content could not be checked");
}

findings.push(
  "src/app/favicon.ico  default Next.js favicon — replace with the client's icon (manual check)",
  "Open Graph image  none configured — add src/app/opengraph-image.* from client assets (manual check)",
);

console.log(`Placeholder check: ${findings.length} item(s) to resolve before launch\n`);
for (const f of findings) console.log(`  - ${f}`);
process.exit(findings.length ? 1 : 0);
