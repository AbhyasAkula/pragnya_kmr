/**
 * Creates the FIRST owner account (or a fresh sign-in link for an existing
 * owner) and prints a one-time link in this terminal only. No password is
 * ever typed here or sent anywhere: the owner chooses it on the website.
 *
 *   npm run admin:create-owner -- owner@company.com "Full Name"
 *   npm run admin:create-owner -- owner@company.com "Full Name" --origin https://your-domain.com
 *
 * Needs DATABASE/DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
 * in .env.local. Also creates the image storage bucket if it's missing.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const PERMISSIONS = ["BOOKINGS", "VILLAS", "GALLERY", "CONSTRUCTION", "CONTENT", "SETTINGS", "AUDIT_LOG"] as const;
const BUCKET = "site-media";

async function main() {
  const args = process.argv.slice(2);
  const originFlag = args.indexOf("--origin");
  const origin = (originFlag >= 0 ? args[originFlag + 1] : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const [rawEmail, ...nameParts] = args.filter((_, i) => i !== originFlag && i !== originFlag + 1);
  const email = rawEmail?.trim().toLowerCase();
  const fullName = nameParts.join(" ").trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !fullName) {
    console.error('Usage: npm run admin:create-owner -- owner@company.com "Full Name" [--origin https://site]');
    process.exit(1);
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secret) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
    process.exit(1);
  }

  const url = new URL(process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "");
  for (const p of ["sslmode", "schema"]) url.searchParams.delete(p);
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } }, { schema: "aurelia" }) });
  const supabase = createClient(supabaseUrl, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    // Storage bucket for uploaded images (public read; writes only with the secret key).
    const { data: bucket } = await supabase.storage.getBucket(BUCKET);
    if (!bucket) {
      const { error } = await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 15 * 1024 * 1024, allowedMimeTypes: ["image/webp"] });
      if (error && !/already exists/i.test(error.message)) throw error;
      console.log(`Created storage bucket "${BUCKET}".`);
    }

    const existing = await db.staffMember.findUnique({ where: { email } });
    if (existing && existing.role !== "OWNER") {
      console.error(`${email} already has a STAFF account. Promote them from the dashboard instead.`);
      process.exitCode = 1;
      return;
    }

    let type: "invite" | "recovery" = existing?.status === "ACTIVE" ? "recovery" : "invite";
    let link = await supabase.auth.admin.generateLink({ type, email });
    if (link.error && type === "invite") {
      type = "recovery"; // auth user already exists (e.g. created earlier)
      link = await supabase.auth.admin.generateLink({ type, email });
    }
    if (link.error || !link.data.properties?.hashed_token) throw link.error ?? new Error("No link returned");
    const userId = link.data.user.id;

    if (!existing) {
      await db.staffMember.create({
        data: { id: userId, email, fullName, role: "OWNER", permissions: [...PERMISSIONS], status: "INVITED" },
      });
      await db.auditLog.create({
        data: { action: "staff.owner_bootstrapped", entityType: "staff", entityId: userId, summary: `Owner account created for ${fullName} (${email}) from the command line` },
      });
    } else if (existing.id !== userId) {
      throw new Error("The staff record and the Supabase user don't match. Check the Supabase Auth users list.");
    }

    const params = new URLSearchParams({ token_hash: link.data.properties.hashed_token, type });
    console.log(`\n${existing ? "Sign-in link" : "Owner account created"} for ${fullName} <${email}>.`);
    console.log("Open this link in a browser to choose a password (works once, expires per your Supabase OTP setting — 1 hour by default):\n");
    console.log(`  ${origin}/admin/auth/confirm?${params}\n`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
