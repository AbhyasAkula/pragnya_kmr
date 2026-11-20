/**
 * Prisma CLI configuration (migrate, generate, studio). Not used at runtime:
 * the app connects through the pg driver adapter in src/lib/server/db.ts.
 *
 * Migrations use DIRECT_URL: Supabase's Supavisor *session* mode (port 5432,
 * with `schema=aurelia` so Prisma's own history table stays out of the
 * Data-API-exposed `public` schema). The app uses DATABASE_URL (transaction
 * mode, port 6543). `prisma generate` needs neither, so builds work without
 * database credentials.
 */
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js keeps local secrets in .env.local; load it (and .env) for the CLI too.
loadEnv({ path: [".env.local", ".env"], quiet: true });

const directUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  ...(directUrl ? { datasource: { url: directUrl } } : {}),
});
