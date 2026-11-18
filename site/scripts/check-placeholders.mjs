#!/usr/bin/env node
/**
 * Launch-readiness check: lists every placeholder still in the codebase.
 * Exits with code 1 while any remain. Run with `npm run check:placeholders`.
 *
 * It only REPORTS — it never invents replacement values.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const scanDirs = ["src/config", "src/content"];

/** Patterns that indicate unreplaced placeholder data. */
const markers = [
  { re: /PLACEHOLDER/, why: "marked placeholder" },
  { re: /example\.com/, why: "example.com address" },
  { re: /images\.unsplash\.com/, why: "stock placeholder imagery" },
  { re: /leadStorageConnected:\s*false/, why: "enquiry form is in demo mode" },
];

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(ts|tsx|json)$/.test(entry.name)) yield path;
  }
}

const findings = [];
for (const dir of scanDirs) {
  for (const file of files(join(root, dir))) {
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        const hit = markers.find((m) => m.re.test(line));
        if (hit) findings.push(`${relative(root, file)}:${i + 1}  ${hit.why}  →  ${line.trim()}`);
      });
  }
}

for (const key of ["NEXT_PUBLIC_CONTACT_PHONE", "NEXT_PUBLIC_CONTACT_EMAIL"]) {
  if (!process.env[key]) findings.push(`env  ${key} is not set (placeholder contact detail in use)`);
}
if (/sample: true/.test(readFileSync(join(root, "src/content/construction.ts"), "utf8"))) {
  findings.push("src/content/construction.ts  sample construction updates shown — replace with real site reports");
}
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  findings.push("env  NEXT_PUBLIC_SITE_URL is not set (site will be noindex, no canonical URLs)");
}
// Structural placeholders: rendered until real drawings are supplied.
const villasSrc = readFileSync(join(root, "src/content/villas.ts"), "utf8");
const levels = (villasSrc.match(/label: "(Ground floor|First floor|Terrace)"/g) ?? []).length;
const drawings = (villasSrc.match(/drawing:/g) ?? []).length;
if (drawings < levels) {
  findings.push(`src/content/villas.ts  ${levels - drawings} floor-plan level(s) still show the placeholder (no approved drawing)`);
}
if (!/^\s*drawing:/m.test(readFileSync(join(root, "src/content/master-plan.ts"), "utf8"))) {
  findings.push("src/content/master-plan.ts  placeholder zoning diagram shown — add the approved master plan as `drawing`");
}

findings.push(
  "src/app/favicon.ico  default Next.js favicon — replace with the client's icon (manual check)",
  "Open Graph image  none configured — add src/app/opengraph-image.* from client assets (manual check)",
);

console.log(`Placeholder check: ${findings.length} item(s) to resolve before launch\n`);
for (const f of findings) console.log(`  - ${f}`);
process.exit(findings.length ? 1 : 0);
