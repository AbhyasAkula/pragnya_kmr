/**
 * Verifies the admin dashboard's Supabase configuration without printing
 * any secret: key types, Auth admin API, Storage bucket, and that booking
 * data is NOT reachable through the public Data API.   npm run admin:check
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: [".env.local", ".env"], quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sec = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const kind = (k) => {
  if (!k) return "MISSING";
  if (k.startsWith("sb_publishable_")) return "publishable";
  if (k.startsWith("sb_secret_")) return "secret";
  try {
    if (k.startsWith("eyJ")) return `legacy JWT (role: ${JSON.parse(Buffer.from(k.split(".")[1], "base64url")).role})`;
  } catch {}
  return "unrecognised format";
};
let failed = false;
const check = (label, okay, detail) => {
  if (!okay) failed = true;
  console.log(`${okay ? "OK  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

check("NEXT_PUBLIC_SUPABASE_URL set", Boolean(url));
check("publishable key", kind(pub).startsWith("publishable") || kind(pub).includes("anon"), kind(pub));
check("secret key", kind(sec).startsWith("secret") || kind(sec).includes("service_role"), kind(sec));
if (url && pub && sec) {
  const admin = createClient(url, sec, { auth: { persistSession: false, autoRefreshToken: false } });
  const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  check("Auth admin API reachable with the secret key", !users.error, users.error?.message);
  const bucket = await admin.storage.getBucket("site-media");
  console.log(`info  storage bucket "site-media": ${bucket.data ? `exists (public: ${bucket.data.public})` : "not created yet (created on first upload or by admin:create-owner)"}`);
  const res = await fetch(`${url}/rest/v1/site_visit_requests?select=id&limit=1`, { headers: { apikey: pub, "Accept-Profile": "aurelia" } });
  check("bookings NOT readable via public Data API (anon)", res.status >= 400, `HTTP ${res.status}`);
  const res2 = await fetch(`${url}/rest/v1/site_visit_requests?select=id&limit=1`, { headers: { apikey: pub } });
  check("no booking table exposed in the public schema", res2.status >= 400, `HTTP ${res2.status}`);
}
process.exit(failed ? 1 : 0);
