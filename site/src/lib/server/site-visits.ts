import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { SiteVisitRequest } from "@/lib/validation/site-visit";
import { getDb } from "./db";

/**
 * Data access for site-visit bookings. The API route writes through here;
 * the Phase 3 admin dashboard should read/update through here too, so all
 * lead access stays server-side in one place.
 */

export type NewSiteVisit = SiteVisitRequest & {
  sourcePath: string | null;
  consentVersion: string;
  idempotencyKey: string;
};

/** Minimal fields returned to the customer — never the full record. */
type Receipt = { reference: string; visitDate: string };

export type CreateResult =
  | { kind: "created"; receipt: Receipt }
  /** Same idempotency key seen before: the original booking is returned. */
  | { kind: "replayed"; receipt: Receipt }
  /** An open request already exists for this phone number and date. */
  | { kind: "duplicate"; visitDate: string };

/** Short, non-sequential reference shown to the customer (from the UUID's random tail). */
export function bookingReference(id: string) {
  return id.replace(/-/g, "").slice(-8).toUpperCase();
}

const receiptOf = (row: { id: string; visitDate: Date }): Receipt => ({
  reference: bookingReference(row.id),
  visitDate: row.visitDate.toISOString().slice(0, 10),
});

async function findByIdempotencyKey(idempotencyKey: string) {
  return getDb().siteVisitRequest.findUnique({
    where: { idempotencyKey },
    select: { id: true, visitDate: true },
  });
}

export async function findReplay(idempotencyKey: string): Promise<CreateResult | null> {
  const existing = await findByIdempotencyKey(idempotencyKey);
  return existing ? { kind: "replayed", receipt: receiptOf(existing) } : null;
}

/** Which unique constraint a P2002 error hit (driver-adapter errors nest it). */
function violatedConstraint(error: Prisma.PrismaClientKnownRequestError): "idempotency" | "phone_date" | null {
  const meta = JSON.stringify(error.meta ?? {});
  if (meta.includes("idempotency")) return "idempotency";
  if (meta.includes("open_phone_date") || (meta.includes("phone") && meta.includes("visit"))) return "phone_date";
  return null;
}

export async function createSiteVisit(input: NewSiteVisit): Promise<CreateResult> {
  try {
    const row = await getDb().siteVisitRequest.create({
      data: {
        name: input.name,
        phone: input.phone,
        visitDate: new Date(`${input.date}T00:00:00.000Z`),
        villa: input.villa,
        message: input.message,
        sourcePath: input.sourcePath,
        consentAt: new Date(),
        consentVersion: input.consentVersion,
        idempotencyKey: input.idempotencyKey,
        // status defaults to NEW in the database: a request, not a confirmed visit.
      },
      select: { id: true, visitDate: true },
    });
    return { kind: "created", receipt: receiptOf(row) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = violatedConstraint(error);
      if (target === "phone_date") return { kind: "duplicate", visitDate: input.date };
      if (target === "idempotency") {
        // A concurrent retry won the race; return what it saved.
        const replay = await findReplay(input.idempotencyKey);
        if (replay) return replay;
      }
    }
    throw error;
  }
}
