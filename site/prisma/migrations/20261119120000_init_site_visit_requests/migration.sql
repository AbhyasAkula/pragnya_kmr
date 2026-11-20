-- Initial lead storage for "Book a Site Visit" requests.
-- Generated from prisma/schema.prisma (prisma migrate diff), with explicit
-- schema qualification and hand-written hardening at the end.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "aurelia";

-- CreateEnum
CREATE TYPE "aurelia"."SiteVisitStatus" AS ENUM ('NEW', 'CONTACTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "aurelia"."site_visit_requests" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(16) NOT NULL,
    "visit_date" DATE NOT NULL,
    "villa" VARCHAR(80),
    "message" VARCHAR(1000),
    "status" "aurelia"."SiteVisitStatus" NOT NULL DEFAULT 'NEW',
    "source_path" VARCHAR(200),
    "consent_at" TIMESTAMPTZ(3) NOT NULL,
    "consent_version" VARCHAR(40) NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aurelia"."rate_limit_buckets" (
    "key" VARCHAR(100) NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_visit_requests_idempotency_key_key" ON "aurelia"."site_visit_requests"("idempotency_key");

-- CreateIndex
CREATE INDEX "site_visit_requests_status_created_at_idx" ON "aurelia"."site_visit_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "site_visit_requests_created_at_idx" ON "aurelia"."site_visit_requests"("created_at" DESC);

-- CreateIndex
CREATE INDEX "site_visit_requests_visit_date_idx" ON "aurelia"."site_visit_requests"("visit_date");

-- CreateIndex: one open request per phone number per visit date
CREATE UNIQUE INDEX "site_visit_requests_open_phone_date_key" ON "aurelia"."site_visit_requests"("phone", "visit_date") WHERE (status IN ('NEW', 'CONTACTED', 'CONFIRMED'));

-- CreateIndex
CREATE INDEX "rate_limit_buckets_window_start_idx" ON "aurelia"."rate_limit_buckets"("window_start");

-- ---------------------------------------------------------------------------
-- Hardening (not expressible in the Prisma schema; Prisma ignores these in
-- future diffs, so they are not dropped by later migrations).
-- ---------------------------------------------------------------------------

-- Data integrity, mirroring src/lib/validation/site-visit.ts.
ALTER TABLE "aurelia"."site_visit_requests"
  ADD CONSTRAINT "site_visit_requests_name_check"    CHECK (char_length(btrim("name")) BETWEEN 2 AND 80),
  ADD CONSTRAINT "site_visit_requests_phone_check"   CHECK ("phone" ~ '^\+?[0-9]{10,15}$'),
  ADD CONSTRAINT "site_visit_requests_villa_check"   CHECK ("villa" IS NULL OR char_length(btrim("villa")) > 0),
  ADD CONSTRAINT "site_visit_requests_message_check" CHECK ("message" IS NULL OR char_length(btrim("message")) > 0),
  ADD CONSTRAINT "site_visit_requests_source_check"  CHECK ("source_path" IS NULL OR "source_path" LIKE '/%');

ALTER TABLE "aurelia"."rate_limit_buckets"
  ADD CONSTRAINT "rate_limit_buckets_hits_check" CHECK ("hits" >= 0);

-- Keep updated_at correct even for changes made outside Prisma (SQL editor,
-- future admin tooling).
CREATE FUNCTION "aurelia"."set_updated_at"() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW."updated_at" := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "site_visit_requests_set_updated_at"
  BEFORE UPDATE ON "aurelia"."site_visit_requests"
  FOR EACH ROW EXECUTE FUNCTION "aurelia"."set_updated_at"();

-- No access for Supabase's public API roles. The schema is not exposed by the
-- Data API, and even if it were added later these roles hold no privileges.
REVOKE ALL ON SCHEMA "aurelia" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA "aurelia" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "aurelia" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "aurelia" FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "aurelia" REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "aurelia" REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "aurelia" REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Row Level Security with no policies = deny-all for non-owner roles
-- (defence in depth). The app connects as the table owner, which bypasses RLS.
ALTER TABLE "aurelia"."site_visit_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aurelia"."rate_limit_buckets" ENABLE ROW LEVEL SECURITY;
