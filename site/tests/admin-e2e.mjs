/**
 * End-to-end tests for the admin dashboard against a RUNNING production
 * server, the real database and Supabase Auth/Storage. Creates synthetic
 * users and content (marked "E2E"), and removes ALL of it afterwards —
 * including its audit-log entries and uploaded files.
 *
 *   npm run build && npx next start -p 3200
 *   BASE_URL=http://localhost:3200 npm run test:admin
 *
 * Optional: BROWSER_CHANNEL=chrome|msedge (default msedge), SHOTS_DIR=… for screenshots.
 */
import { execFileSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import pg from "pg";
import { chromium } from "playwright-core";
import sharp from "sharp";

config({ path: [".env.local", ".env"], quiet: true });
const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const SHOTS = process.env.SHOTS_DIR ?? join(tmpdir(), "aurelia-admin-shots");
mkdirSync(SHOTS, { recursive: true });

const RUN = randomBytes(3).toString("hex");
const runStart = new Date(Date.now() - 5000);
const pw = () => `E2e-${randomBytes(12).toString("base64url")}-x9`;
const mail = (who) => `aurelia-e2e-${who}-${RUN}@example.com`;
const hash = (v) => createHmac("sha256", process.env.LEAD_HASH_SECRET).update(v).digest("base64url").slice(0, 32);

const dbUrl = new URL(process.env.DIRECT_URL);
for (const p of ["sslmode", "schema"]) dbUrl.searchParams.delete(p);
const db = new pg.Client({ connectionString: dbUrl.toString(), ssl: { rejectUnauthorized: false } });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const q = async (sql, params = []) => (await db.query(sql, params)).rows;

let pass = 0;
let fail = 0;
const failures = [];
function check(cond, label) {
  if (cond) pass++;
  else {
    fail++;
    failures.push(label);
  }
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
}
async function step(name, fn) {
  console.log(`\n▶ ${name}`);
  try {
    await fn();
  } catch (e) {
    fail++;
    failures.push(`${name}: ${e.message.split("\n")[0]}`);
    console.log(`FAIL  ${name} threw: ${e.message.slice(0, 600)}`);
    if (globalThis.__page) {
      const file = join(SHOTS, `failure-${name.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.png`);
      await globalThis.__page.screenshot({ path: file, fullPage: true }).catch(() => undefined);
      console.log(`      url: ${globalThis.__page.url()} · screenshot: ${file}`);
    }
  }
}

/* ------------------------------- fixtures -------------------------------- */

const users = {
  owner: { email: mail("owner"), password: pw(), name: "E2E Owner", role: "OWNER", perms: ["BOOKINGS", "VILLAS", "GALLERY", "CONSTRUCTION", "CONTENT", "SETTINGS", "AUDIT_LOG"], status: "ACTIVE" },
  sales: { email: mail("sales"), password: pw(), name: "E2E Sales", role: "STAFF", perms: ["BOOKINGS"], status: "ACTIVE" },
  media: { email: mail("media"), password: pw(), name: "E2E Media", role: "STAFF", perms: ["GALLERY"], status: "ACTIVE" },
  gone: { email: mail("disabled"), password: pw(), name: "E2E Disabled", role: "STAFF", perms: ["BOOKINGS"], status: "DISABLED" },
};
const extraEmails = [mail("invitee"), mail("bootstrap"), mail("throttle")];
const ids = {};
const ips = { owner: "198.51.100.11", sales: "198.51.100.12", media: "198.51.100.13", invitee: "198.51.100.14", boot: "198.51.100.15", throttle: "198.51.100.16", gone: "198.51.100.17", anon: "198.51.100.18" };
const testPhone = `+9199997${RUN.replace(/\D/g, "0").padEnd(5, "1").slice(0, 5)}`;
const original = {};

async function setup() {
  await db.connect();
  for (const [key, u] of Object.entries(users)) {
    const { data, error } = await admin.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
    if (error) throw new Error(`createUser ${key}: ${error.message}`);
    ids[key] = data.user.id;
    await q(
      `INSERT INTO aurelia.staff_members (id, email, full_name, role, permissions, status, last_sign_in_at)
       VALUES ($1, $2, $3, $4::aurelia."StaffRole", $5::aurelia."Permission"[], $6::aurelia."StaffStatus", now())`,
      [data.user.id, u.email, u.name, u.role, u.perms, u.status],
    );
  }
  for (const key of ["home.hero", "settings"]) original[key] = (await q(`SELECT data FROM aurelia.content_entries WHERE key = $1`, [key]))[0]?.data;
  // Test image with EXIF metadata (must be stripped on upload).
  const img = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: { r: 180, g: 150, b: 110 } } })
    .jpeg()
    .withExif({ IFD0: { Copyright: "E2E-EXIF-MARKER", Artist: "E2E" } })
    .toBuffer();
  writeFileSync(join(SHOTS, "e2e-upload.jpg"), img);
}

/* -------------------------------- browser -------------------------------- */

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge", headless: true });
const ctx = (ip, viewport = { width: 1440, height: 900 }) => browser.newContext({ viewport, extraHTTPHeaders: { "x-forwarded-for": ip } });

async function login(page, email, password) {
  await page.goto(`${BASE}/admin/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}
const msg = (page, text) => page.getByText(text, { exact: false }).first().waitFor({ timeout: 20_000 });
/** Clicks a submit button and waits for its Server Action round-trip to finish. */
async function submit(page, name) {
  const done = page.waitForResponse((r) => r.request().method() === "POST" && Boolean(r.request().headers()["next-action"]), { timeout: 30_000 });
  await page.getByRole("button", { name, exact: true }).click();
  await done;
  await page.waitForTimeout(150); // let React commit the returned state
}

/** Captures the next Server Action POST so it can be replayed with another session. */
function captureAction(page) {
  return page.waitForRequest((r) => r.method() === "POST" && Boolean(r.headers()["next-action"]), { timeout: 20_000 });
}
async function replay(context, req) {
  const h = req.headers();
  const res = await context.request.post(req.url(), {
    headers: {
      "next-action": h["next-action"],
      "content-type": h["content-type"],
      accept: "text/x-component",
      origin: BASE,
      ...(h["next-router-state-tree"] ? { "next-router-state-tree": h["next-router-state-tree"] } : {}),
    },
    data: req.postDataBuffer(),
  });
  return { status: res.status(), body: await res.text() };
}
/** 404, or the noindex "not found" page (a first on-demand render can stream with HTTP 200). */
const isNotFound = (r, mustNotContain) =>
  (r.status === 404 || (/could not be found/.test(r.text) && /noindex/.test(r.raw))) && !r.text.includes(mustNotContain);
const publicText = async (path) => {
  const res = await fetch(`${BASE}${path}`, { headers: { "x-forwarded-for": ips.anon } });
  const raw = await res.text();
  return { status: res.status, raw, text: raw.replace(/<[^>]+>/g, " ") };
};

/* --------------------------------- tests --------------------------------- */

let ownerCtx, ownerPage, salesCtx, mediaCtx;
const villaSlug = `e2e-test-villa-${RUN}`;
const marker = `E2E-MARKER-${RUN}`;
let capturedPublish = null;
let bookingId = null;

try {
  await setup();
  console.log(`Run ${RUN}: synthetic users created.`);

  await step("Sign-in security", async () => {
    const c = await ctx(ips.gone);
    const p = await c.newPage();
    await login(p, users.owner.email, "wrong-password-123");
    await msg(p, "don't match an account");
    check(p.url().includes("/admin/login"), "wrong password is rejected with a generic message");
    await login(p, users.gone.email, users.gone.password);
    await msg(p, "has been disabled");
    check(true, "disabled account cannot sign in");
    await p.goto(`${BASE}/admin/villas`);
    check(p.url().includes("/admin/login"), "signed-out visitor is redirected to sign-in");
    const res = await p.goto(`${BASE}/admin/login`);
    const h = res.headers();
    check(h["x-frame-options"] === "DENY" && h["x-robots-tag"]?.includes("noindex") && h["cache-control"]?.includes("no-store"), "admin responses carry security headers (no framing, noindex, no-store)");
    await c.close();
  });

  await step("Owner dashboard (real data)", async () => {
    ownerCtx = await ctx(ips.owner);
    ownerPage = await ownerCtx.newPage();
    await login(ownerPage, users.owner.email, users.owner.password);
    await ownerPage.waitForURL(`${BASE}/admin`, { timeout: 20_000 });
    check(true, "owner signs in and lands on the dashboard");
    const newCount = Number((await q(`SELECT count(*)::int AS n FROM aurelia.site_visit_requests WHERE status = 'NEW'`))[0].n);
    const tile = await ownerPage.locator("a", { hasText: "New requests" }).first().innerText();
    check(tile.includes(String(newCount)), `"New requests" tile shows the database count (${newCount})`);
    for (const nav of ["Bookings", "Villas", "Gallery", "Construction", "Content", "Staff", "Audit log", "Settings"]) {
      check(await ownerPage.getByRole("link", { name: nav, exact: true }).first().isVisible(), `owner sees "${nav}" in navigation`);
    }
    const audit = await q(`SELECT 1 FROM aurelia.audit_logs WHERE actor_id = $1 AND action = 'auth.sign_in'`, [ids.owner]);
    check(audit.length === 1, "sign-in is recorded in the audit log");
  });

  await step("Bookings: search, status, assignment, follow-up, notes", async () => {
    const res = await fetch(`${BASE}/api/site-visit`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ips.anon, origin: BASE },
      body: JSON.stringify({
        name: `E2E Booking ${RUN}`,
        phone: testPhone,
        date: new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10),
        villa: "",
        message: "Synthetic admin test — safe to delete.",
        consent: true,
        company: "",
        idempotencyKey: crypto.randomUUID(),
        sourcePath: "/contact",
      }),
    });
    check(res.status === 201, `synthetic booking created through the public API (HTTP ${res.status})`);
    bookingId = (await q(`SELECT id FROM aurelia.site_visit_requests WHERE phone = $1`, [testPhone]))[0]?.id;

    const p = ownerPage;
    await p.goto(`${BASE}/admin/bookings?q=${encodeURIComponent(`E2E Booking ${RUN}`)}`);
    await p.getByRole("link", { name: `E2E Booking ${RUN}` }).first().click();
    await p.waitForURL(/\/admin\/bookings\/[0-9a-f-]{36}$/);
    check(true, "booking found by name search and opened");

    await p.getByLabel("Booking status").selectOption("CONTACTED");
    await p.getByRole("button", { name: "Update status" }).click();
    await msg(p, "Status changed to Contacted");
    await p.getByLabel("Responsible team member").selectOption({ label: users.sales.name });
    await p.getByRole("button", { name: "Save assignment" }).click();
    await msg(p, `Assigned to ${users.sales.name}`);
    await p.getByLabel("Next follow-up").fill("2026-12-01T10:30");
    await p.getByRole("button", { name: "Schedule" }).click();
    await msg(p, "Follow-up scheduled");
    await p.getByLabel("Add a note").fill(`Called the customer (${marker}).`);
    await p.getByRole("button", { name: "Add note" }).click();
    await msg(p, "Note added");

    const [b] = await q(`SELECT status, assigned_to_id, follow_up_at FROM aurelia.site_visit_requests WHERE id = $1`, [bookingId]);
    check(b.status === "CONTACTED", "status saved in the database");
    check(b.assigned_to_id === ids.sales, "assignment saved in the database");
    check(b.follow_up_at?.toISOString() === "2026-12-01T05:00:00.000Z", "follow-up saved as 10:30 India time");
    const acts = await q(`SELECT type FROM aurelia.site_visit_activities WHERE request_id = $1 ORDER BY created_at`, [bookingId]);
    check(acts.map((a) => a.type).join(",") === "STATUS_CHANGED,ASSIGNED,FOLLOW_UP_SET,NOTE", "activity timeline recorded in order");
    await p.reload();
    check(await p.getByText(`Called the customer (${marker}).`).isVisible(), "note appears in the timeline");
    const audits = await q(`SELECT summary FROM aurelia.audit_logs WHERE entity_id = $1`, [bookingId]);
    check(audits.length === 4 && audits.every((a) => !a.summary.includes(testPhone) && !a.summary.includes("E2E Booking")), "audit entries reference the booking without personal data");
  });

  await step("Content: edit homepage banner and see it on the website", async () => {
    const p = ownerPage;
    await p.goto(`${BASE}/admin/content/homepage-banner`);
    const subtitle = p.getByLabel("Subtitle");
    const before = await subtitle.inputValue();
    await subtitle.fill(`${before} ${marker}`);
    await submit(p, "Save changes");
    await msg(p, "Saved and published to the website");
    const home = await publicText("/");
    check(home.text.includes(marker), "change is live on the public homepage");
    check(home.text.includes("186 architect-designed villas"), "{tokens} still resolve after editing");
    await subtitle.fill(before);
    await submit(p, "Save changes");
    await msg(p, "Saved and published to the website");
    check(!(await publicText("/")).text.includes(marker), "original text restored on the website");

    await subtitle.fill("");
    await submit(p, "Save changes");
    await msg(p, "Please fix the highlighted fields");
    check(await p.getByText("Required").first().isVisible(), "empty required field shows an inline error and is not saved");
  });

  await step("Villas: create draft with upload, publish, unpublish, delete", async () => {
    const p = ownerPage;
    await p.goto(`${BASE}/admin/villas/new`);
    await p.getByLabel("Villa name").fill(`E2E Villa ${RUN}`);
    await p.getByLabel("Web address").fill(villaSlug);
    await p.getByLabel("Configuration").fill("5 BHK Test");
    await p.getByLabel("One-line summary").fill("Synthetic villa created by the admin end-to-end test.");
    for (const [label, v] of [["Starting price", "51000000"], ["Homes of this model", "4"], ["Built-up area", "4800"], ["Plot area", "420"], ["Floors", "2"], ["Bedrooms", "5"], ["Bathrooms", "6"], ["Car parks", "3"]]) {
      await p.getByLabel(label, { exact: true }).fill(v);
    }
    await p.getByLabel("Paragraph 1", { exact: true }).fill("A synthetic description paragraph for testing.");
    await p.locator('input[type="file"]').first().setInputFiles(join(SHOTS, "e2e-upload.jpg"));
    const alt = p.getByLabel("Description for screen readers (alt text)").first();
    await p.waitForFunction(() => !document.querySelector('input[placeholder^="e.g. Villa facade"]')?.disabled, null, { timeout: 30_000 });
    await alt.fill("Synthetic test image");
    await p.getByRole("button", { name: "Create draft" }).click();
    await p.waitForURL(/\/admin\/villas\/[0-9a-f-]{36}\?created=1/, { timeout: 30_000 });
    check(true, "villa draft created with an uploaded image");
    const [v] = await q(`SELECT id, status, image FROM aurelia.villas WHERE slug = $1`, [villaSlug]);
    check(v?.status === "DRAFT", "new villa is a DRAFT");
    check(isNotFound(await publicText(`/villas/${villaSlug}`), `E2E Villa ${RUN}`), "draft villa is not on the website");

    // Uploaded file: stored as WebP with metadata stripped.
    const asset = (await q(`SELECT url, mime_type FROM aurelia.media_assets WHERE url = $1`, [v.image.src]))[0];
    const meta = await sharp(Buffer.from(await (await fetch(asset.url)).arrayBuffer())).metadata();
    check(meta.format === "webp" && !meta.exif, "uploaded image re-encoded to WebP with EXIF removed");

    const req = captureAction(p);
    await p.getByRole("button", { name: "Publish", exact: true }).click();
    capturedPublish = await req;
    await p.getByRole("button", { name: "Unpublish" }).waitFor();
    const live = await publicText(`/villas/${villaSlug}`);
    check(live.status === 200 && live.text.includes(`E2E Villa ${RUN}`), "published villa page is live");
    check((await publicText("/villas")).text.includes(`E2E Villa ${RUN}`), "published villa listed on /villas");
    check((await publicText("/")).text.includes("190 architect-designed villas"), "villa total on the homepage updates (186 + 4)");

    await p.getByRole("button", { name: "Unpublish" }).click();
    await p.getByRole("button", { name: "Publish", exact: true }).waitFor();
    check(isNotFound(await publicText(`/villas/${villaSlug}`), `E2E Villa ${RUN}`), "unpublished villa is removed from the website");
    check(!(await publicText("/villas")).text.includes(`E2E Villa ${RUN}`), "unpublished villa removed from /villas");
  });

  await step("Permissions are enforced on the server (not just hidden in the UI)", async () => {
    salesCtx = await ctx(ips.sales);
    const p = await salesCtx.newPage();
    await login(p, users.sales.email, users.sales.password);
    await p.waitForURL(`${BASE}/admin`);
    check(!(await p.getByRole("link", { name: "Villas", exact: true }).count()), "bookings-only staff don't see Villas in navigation");
    check(!(await p.getByRole("link", { name: "Staff", exact: true }).count()), "staff never see Staff management");
    await p.goto(`${BASE}/admin/villas`);
    check(await p.getByText("You don't have access to villas").isVisible(), "opening /admin/villas directly shows access denied");
    await p.goto(`${BASE}/admin/staff`);
    check(await p.getByText("You don't have access to staff management").isVisible(), "opening /admin/staff directly shows access denied");

    const r = await replay(salesCtx, capturedPublish);
    const [v] = await q(`SELECT status FROM aurelia.villas WHERE slug = $1`, [villaSlug]);
    check(r.body.includes("permission") && v.status === "DRAFT", "replaying the owner's 'publish villa' action as staff is refused; villa stays a draft");
    const anon = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": ips.anon } });
    const r2 = await replay(anon, capturedPublish);
    check(!r2.body.includes("Published") && (await q(`SELECT status FROM aurelia.villas WHERE slug = $1`, [villaSlug]))[0].status === "DRAFT", "replaying it with no session is refused");
    await anon.close();

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array([1, 2, 3])]), "x.jpg");
    const up = await salesCtx.request.post(`${BASE}/api/admin/media`, { headers: { origin: BASE }, multipart: { file: { name: "x.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image") } } });
    check(up.status() === 403, `staff without content permissions can't upload (HTTP ${up.status()})`);
    const anonUp = await fetch(`${BASE}/api/admin/media`, { method: "POST", headers: { origin: BASE }, body: form });
    check(anonUp.status === 401, `upload without a session is refused (HTTP ${anonUp.status})`);
    const list = await fetch(`${BASE}/api/admin/media`);
    check(list.status === 401, "media library listing requires a session");
  });

  await step("Gallery (staff with GALLERY only): upload, publish, validate, delete", async () => {
    mediaCtx = await ctx(ips.media);
    const p = await mediaCtx.newPage();
    await login(p, users.media.email, users.media.password);
    await p.waitForURL(`${BASE}/admin`);
    await p.goto(`${BASE}/admin/gallery`);
    await p.getByLabel("Publish immediately").check();
    await p.locator("#gallery-files").setInputFiles(join(SHOTS, "e2e-upload.jpg"));
    const caption = p.getByLabel("Caption for e2e-upload.jpg");
    await caption.waitFor({ timeout: 30_000 });
    await caption.fill(`E2E Gallery ${RUN}`);
    await p.getByRole("button", { name: /Add 1 to gallery/ }).click();
    await msg(p, "1 image added and published");
    check((await publicText("/gallery")).text.includes(`E2E Gallery ${RUN}`), "uploaded image is live on /gallery");

    // A rejected upload: not an image.
    const bad = await mediaCtx.request.post(`${BASE}/api/admin/media`, { headers: { origin: BASE }, multipart: { file: { name: "evil.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<script>alert(1)</script>".repeat(10)) } } });
    check(bad.status() === 415, `non-image file disguised as .jpg is rejected (HTTP ${bad.status()})`);
    const cross = await mediaCtx.request.post(`${BASE}/api/admin/media`, { headers: { origin: "https://evil.example" }, multipart: { file: { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") } } });
    check(cross.status() === 403, "cross-site upload is blocked");

    const [item] = await q(`SELECT id, src FROM aurelia.gallery_items WHERE caption = $1`, [`E2E Gallery ${RUN}`]);
    await p.goto(`${BASE}/admin/gallery/${item.id}`);
    await p.getByRole("button", { name: "Delete", exact: true }).click();
    await p.locator("dialog[open]").getByRole("button", { name: "Delete image" }).click();
    await p.waitForURL(/\/admin\/gallery\?deleted=1/);
    check(!(await publicText("/gallery")).text.includes(`E2E Gallery ${RUN}`), "deleted image is removed from /gallery");
    const path = item.src.split("/site-media/")[1];
    const dir = path.slice(0, path.lastIndexOf("/"));
    const { data: listed } = await admin.storage.from("site-media").list(dir, { search: path.slice(path.lastIndexOf("/") + 1) });
    check(Array.isArray(listed) && listed.length === 0, "the unused image file is deleted from storage");
    check((await q(`SELECT 1 FROM aurelia.media_assets WHERE url = $1`, [item.src])).length === 0, "its media-library record is removed");

    await p.goto(`${BASE}/admin/bookings`);
    check(await p.getByText("You don't have access to bookings").isVisible(), "gallery-only staff can't open bookings (customer data)");
  });

  await step("Construction: create, publish, show on website, delete", async () => {
    const p = ownerPage;
    await p.goto(`${BASE}/admin/construction/updates/new`);
    await p.getByLabel("Overall progress").fill("41");
    await p.getByLabel("Title", { exact: true }).fill(`E2E Update ${RUN}`);
    await p.getByLabel("Summary").fill("Synthetic construction update for testing.");
    await p.getByRole("button", { name: "Create draft" }).click();
    await p.waitForURL(/\/admin\/construction\/updates\/[0-9a-f-]{36}\?created=1/);
    check(!(await publicText("/construction-progress")).text.includes(`E2E Update ${RUN}`), "draft update not on the website");
    await p.getByRole("button", { name: "Publish", exact: true }).click();
    await p.getByRole("button", { name: "Unpublish" }).waitFor();
    const page = await publicText("/construction-progress");
    check(page.text.includes(`E2E Update ${RUN}`), "published update is live on /construction-progress");
    await p.getByRole("button", { name: "Delete", exact: true }).click();
    await p.locator("dialog[open]").getByRole("button", { name: "Delete update" }).click();
    await p.waitForURL(/\/admin\/construction\?deleted=1/);
    check(!(await publicText("/construction-progress")).text.includes(`E2E Update ${RUN}`), "deleted update removed from the website");
  });

  await step("Settings: online bookings switch", async () => {
    const p = ownerPage;
    await p.goto(`${BASE}/admin/settings`);
    await p.getByLabel("Accept site-visit requests through the website").uncheck();
    await submit(p, "Save changes");
    await msg(p, "Saved and published");
    const post = (body) =>
      fetch(`${BASE}/api/site-visit`, { method: "POST", headers: { "content-type": "application/json", origin: BASE, "x-forwarded-for": ips.anon }, body: JSON.stringify(body) });
    const off = await post({ idempotencyKey: crypto.randomUUID() });
    check(off.status === 503, `booking API refuses requests while switched off (HTTP ${off.status})`);
    check((await publicText("/contact")).text.includes("Online booking is unavailable right now"), "contact form tells visitors to call instead");
    await p.getByLabel("Accept site-visit requests through the website").check();
    await submit(p, "Save changes");
    await msg(p, "Saved and published");
    const on = await post({ idempotencyKey: crypto.randomUUID() });
    check(on.status === 422, `booking API accepts requests again (validation runs: HTTP ${on.status})`);
    check(!(await publicText("/contact")).text.includes("Online booking is unavailable right now"), "contact form is bookable again");
  });

  await step("Staff: invite → accept → change permissions → disable", async () => {
    const p = ownerPage;
    await p.goto(`${BASE}/admin/staff/new`);
    await p.getByLabel("Full name").fill("E2E Invitee");
    await p.getByLabel("Work email").fill(mail("invitee"));
    await p.getByLabel(/^Bookings/).uncheck();
    await p.getByLabel(/^Website content/).check();
    await p.getByRole("button", { name: "Create invitation" }).click();
    await msg(p, "Invitation created");
    const link = await p.locator("#secret-link").inputValue();
    check(link.startsWith(`${BASE}/admin/auth/confirm?token_hash=`), "one-time invitation link shown to the owner");
    const [invited] = await q(`SELECT id, status, array_to_string(permissions, ',') AS permissions FROM aurelia.staff_members WHERE email = $1`, [mail("invitee")]);
    ids.invitee = invited.id;
    check(invited.status === "INVITED" && invited.permissions === "CONTENT", "invited account stored with only the chosen permission");

    const c = await ctx(ips.invitee, { width: 390, height: 844 });
    const ip = await c.newPage();
    globalThis.__page = ip;
    await ip.goto(link);
    await ip.getByRole("button", { name: "Continue" }).click();
    await ip.waitForURL(`${BASE}/admin/set-password`);
    await ip.getByLabel("New password", { exact: true }).fill("short");
    await ip.getByLabel("Confirm new password").fill("short");
    await ip.getByRole("button", { name: "Save password and continue" }).click();
    await msg(ip, "at least 12 characters");
    check(true, "weak password rejected");
    const newPw = pw();
    await ip.getByLabel("New password", { exact: true }).fill(newPw);
    await ip.getByLabel("Confirm new password").fill(newPw);
    await ip.getByRole("button", { name: "Save password and continue" }).click();
    await ip.waitForURL(/\/admin\?welcome=1/);
    check((await q(`SELECT status FROM aurelia.staff_members WHERE id = $1`, [ids.invitee]))[0].status === "ACTIVE", "invitee set a password and is now ACTIVE");
    await ip.goto(link);
    await ip.getByRole("button", { name: "Continue" }).click();
    await msg(ip, "expired or was already used");
    check(true, "invitation link cannot be reused");

    await p.goto(`${BASE}/admin/staff/${ids.invitee}`);
    await p.getByLabel(/^Website content/).uncheck();
    await p.getByLabel(/^Gallery/).check();
    await p.getByRole("button", { name: "Save changes" }).click();
    await msg(p, "Changes saved");
    await ip.goto(`${BASE}/admin/content`);
    check(await ip.getByText("You don't have access to website content").isVisible(), "removed permission applies immediately to a signed-in user");

    await p.getByRole("button", { name: "Disable account" }).click();
    await p.locator("dialog[open]").getByRole("button", { name: "Disable account" }).click();
    await msg(p, "can no longer sign in");
    await ip.goto(`${BASE}/admin/gallery`);
    await ip.waitForURL(/\/admin\/login/, { timeout: 15_000 }).catch(() => undefined);
    check(ip.url().includes("/admin/login"), `disabled user's open session loses access immediately (now at ${ip.url().replace(BASE, "")})`);
    await c.close();

    // Owner protections (server-side).
    await p.goto(`${BASE}/admin/staff/${ids.owner}`);
    check(!(await p.getByRole("button", { name: "Disable account" }).count()), "owner can't disable their own account (no control offered)");
    check(await p.getByText("You can't change your own role").isVisible(), "owner can't change their own role");
  });

  await step("Owner bootstrap script (first-owner setup)", async () => {
    const out = execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/create-owner.ts", mail("bootstrap"), "E2E Bootstrap Owner", "--origin", BASE], {
      encoding: "utf8",
    });
    const link = /(https?:\/\/\S+\/admin\/auth\/confirm\?\S+)/.exec(out)?.[1];
    check(Boolean(link), "create-owner prints a one-time link (no password involved)");
    const c = await ctx(ips.boot);
    const bp = await c.newPage();
    await bp.goto(link);
    await bp.getByRole("button", { name: "Continue" }).click();
    await bp.waitForURL(`${BASE}/admin/set-password`);
    const p2 = pw();
    await bp.getByLabel("New password", { exact: true }).fill(p2);
    await bp.getByLabel("Confirm new password").fill(p2);
    await bp.getByRole("button", { name: "Save password and continue" }).click();
    await bp.waitForURL(/\/admin\?welcome=1/);
    check(await bp.getByRole("link", { name: "Staff", exact: true }).first().isVisible(), "bootstrapped owner has full access");
    ids.bootstrap = (await q(`SELECT id FROM aurelia.staff_members WHERE email = $1`, [mail("bootstrap")]))[0]?.id;
    await c.close();
  });

  await step("Login throttling", async () => {
    const c = await ctx(ips.throttle);
    const p = await c.newPage();
    for (let i = 0; i < 9; i++) {
      await p.goto(`${BASE}/admin/login`);
      await p.getByLabel("Email").fill(mail("throttle"));
      await p.getByLabel("Password").fill(`wrong-${i}-password`);
      await submit(p, "Sign in");
      await p.getByText(/don't match an account|Too many sign-in attempts/).first().waitFor({ timeout: 20_000 });
    }
    check(await p.getByText("Too many sign-in attempts").isVisible(), "9th attempt for one email within 15 minutes is throttled");
    await c.close();
  });

  await step("Audit log", async () => {
    const p = ownerPage;
    await p.goto(`${BASE}/admin/audit?actor=${ids.owner}`);
    await p.locator("main ol > li").first().waitFor({ timeout: 15_000 }); // list streams in after the header
    const shown = await p.locator("main ol > li p:first-child").allInnerTexts();
    const ok = shown.some((t) => t.trim() === `Published villa “E2E Villa ${RUN}”`);
    check(ok, "audit log page lists the owner's actions");
    if (!ok) {
      const inDb = (await q(`SELECT count(*)::int AS n FROM aurelia.audit_logs WHERE actor_id = $1`, [ids.owner]))[0].n;
      const main = (await p.locator("main").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 400);
      console.log(`      audit page shows ${shown.length} entries; DB has ${inDb} for this owner. Page text: ${main}`);
      await p.screenshot({ path: join(SHOTS, "failure-audit.png"), fullPage: true });
    }
    let blocked = false;
    try {
      await q(`UPDATE aurelia.audit_logs SET summary = 'tampered' WHERE actor_id = $1`, [ids.owner]);
    } catch (e) {
      blocked = /append-only/.test(e.message);
    }
    check(blocked, "audit entries can't be modified, even with direct database access");
  });

  await step("Responsive layout and screenshots", async () => {
    for (const [name, vp] of [["phone", { width: 390, height: 844 }], ["tablet", { width: 820, height: 1180 }], ["desktop", { width: 1440, height: 900 }]]) {
      const c = await ctx(ips.owner, vp);
      await c.addCookies(await ownerCtx.cookies());
      const p = await c.newPage();
      for (const path of ["/admin", "/admin/bookings", "/admin/villas", "/admin/gallery", "/admin/content/amenities", "/admin/staff", "/admin/audit"]) {
        await p.goto(`${BASE}${path}`);
        const overflow = await p.evaluate(() => {
          const vw = window.innerWidth;
          const culprits = [...document.querySelectorAll("main *")]
            .filter((el) => el.getBoundingClientRect().right > vw + 1 && el.children.length === 0)
            .slice(0, 3)
            .map((el) => `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}">${(el.textContent ?? "").slice(0, 40)}`);
          return { by: document.documentElement.scrollWidth - vw, culprits };
        });
        check(overflow.by <= 0, `${name}: ${path} has no horizontal scrolling`);
        if (overflow.by > 0) console.log(`      overflow ${overflow.by}px: ${overflow.culprits.join(" | ")}`);
      }
      await p.goto(`${BASE}/admin`);
      await p.screenshot({ path: join(SHOTS, `dashboard-${name}.png`), fullPage: name !== "desktop" });
      if (bookingId) {
        await p.goto(`${BASE}/admin/bookings/${bookingId}`);
        await p.screenshot({ path: join(SHOTS, `booking-${name}.png`), fullPage: true });
      }
      if (name === "phone") {
        await p.goto(`${BASE}/admin/bookings`);
        await p.getByRole("button", { name: "Open menu" }).click();
        await p.screenshot({ path: join(SHOTS, "menu-phone.png") });
        await p.keyboard.press("Escape");
      }
      await c.close();
    }
    await ownerPage.goto(`${BASE}/admin/villas`);
    await ownerPage.screenshot({ path: join(SHOTS, "villas-desktop.png") });
    await ownerPage.goto(`${BASE}/admin/gallery`);
    await ownerPage.screenshot({ path: join(SHOTS, "gallery-desktop.png") });
    check(true, `screenshots saved to ${SHOTS}`);
  });
} finally {
  /* -------------------------------- cleanup -------------------------------- */
  console.log("\n▶ Cleanup");
  await browser.close().catch(() => undefined);
  try {
    if (!db._connected) await db.connect().catch(() => undefined);
    const emails = [...Object.values(users).map((u) => u.email), ...extraEmails];
    const staffIds = (await q(`SELECT id FROM aurelia.staff_members WHERE email = ANY($1)`, [emails])).map((r) => r.id);
    const allIds = [...new Set([...staffIds, ...Object.values(ids).filter(Boolean)])];

    // Restore content exactly as it was.
    for (const [key, data] of Object.entries(original)) if (data) await q(`UPDATE aurelia.content_entries SET data = $2 WHERE key = $1`, [key, data]);

    const assets = await q(`SELECT id, storage_path FROM aurelia.media_assets WHERE uploaded_by_id = ANY($1::uuid[])`, [allIds]);
    const v = await q(`DELETE FROM aurelia.villas WHERE slug = $1 RETURNING id`, [villaSlug]);
    const g = await q(`DELETE FROM aurelia.gallery_items WHERE caption LIKE $1 RETURNING id`, [`E2E % ${RUN}`]);
    const u = await q(`DELETE FROM aurelia.construction_updates WHERE title LIKE $1 RETURNING id`, [`E2E % ${RUN}`]);
    if (assets.length) {
      await admin.storage.from("site-media").remove(assets.map((a) => a.storage_path));
      await q(`DELETE FROM aurelia.media_assets WHERE id = ANY($1::uuid[])`, [assets.map((a) => a.id)]);
    }
    const bk = await q(`DELETE FROM aurelia.site_visit_requests WHERE phone = $1 RETURNING id`, [testPhone]);
    const st = await q(`DELETE FROM aurelia.staff_members WHERE id = ANY($1::uuid[]) RETURNING id`, [allIds]);
    let authDeleted = 0;
    for (const id of allIds) if (!(await admin.auth.admin.deleteUser(id)).error) authDeleted++;

    // Test audit entries: the trigger blocks deletes, so disable it only inside this transaction.
    await q("BEGIN");
    await q(`ALTER TABLE aurelia.audit_logs DISABLE TRIGGER audit_logs_no_update`);
    const al = await q(
      `DELETE FROM aurelia.audit_logs
        WHERE actor_id = ANY($1::uuid[]) OR entity_id = ANY($2::text[])
           OR (created_at >= $3 AND actor_id IS NULL AND (action LIKE 'auth.%' OR action = 'staff.owner_bootstrapped'))
        RETURNING id`,
      [allIds, [...allIds, ...(bookingId ? [bookingId] : []), ...v.map((r) => r.id), ...g.map((r) => r.id), ...u.map((r) => r.id)], runStart],
    );
    await q(`ALTER TABLE aurelia.audit_logs ENABLE TRIGGER audit_logs_no_update`);
    await q("COMMIT");

    const subjects = [
      ...Object.values(ips).map((ip) => hash(`ip:${ip}`)),
      ...emails.map((e) => hash(`email:${e}`)),
      ...allIds.map((id) => hash(`staff:${id}`)),
      hash(`phone:${testPhone}`),
    ];
    const rl = await q(`DELETE FROM aurelia.rate_limit_buckets WHERE split_part(key, ':', 2) = ANY($1) RETURNING key`, [subjects]);
    const left = await q(`SELECT
      (SELECT count(*) FROM aurelia.staff_members WHERE email LIKE 'aurelia-e2e-%')::int AS staff,
      (SELECT count(*) FROM aurelia.site_visit_requests WHERE phone = $1)::int AS bookings,
      (SELECT count(*) FROM aurelia.villas WHERE slug LIKE 'e2e-test-villa-%')::int AS villas,
      (SELECT count(*) FROM aurelia.gallery_items WHERE caption LIKE 'E2E %')::int AS gallery,
      (SELECT count(*) FROM aurelia.construction_updates WHERE title LIKE 'E2E %')::int AS updates`, [testPhone]);
    console.log(
      `removed: ${st.length} staff, ${authDeleted} auth users, ${bk.length} booking, ${v.length} villa, ${g.length} gallery, ${u.length} updates, ${assets.length} uploaded files, ${al.length} audit entries, ${rl.length} rate-limit counters; content restored`,
    );
    console.log(`left behind: ${JSON.stringify(left[0])}`);
  } catch (e) {
    console.log("CLEANUP ERROR:", e.message);
    fail++;
  } finally {
    await db.end().catch(() => undefined);
  }
  console.log(`\n${pass} passed, ${fail} failed${failures.length ? `\nFailures:\n - ${failures.join("\n - ")}` : ""}`);
  process.exit(fail ? 1 : 0);
}
