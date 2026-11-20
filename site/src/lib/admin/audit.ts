import "server-only";
import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { hashKey } from "@/lib/server/rate-limit";
import type { AdminUser } from "./session";

/**
 * Append-only audit trail (aurelia.audit_logs; UPDATE/DELETE are blocked by
 * a database trigger). Summaries must never contain customer phone numbers
 * or messages — refer to bookings by reference only.
 */
export type AuditEntry = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export async function clientIpHash() {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
    return hashKey(`ip:${ip}`);
  } catch {
    return null;
  }
}

export async function audit(actor: Pick<AdminUser, "id" | "email" | "role"> | null, entry: AuditEntry) {
  try {
    await getDb().auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? null,
        actorRole: actor?.role ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary.slice(0, 300),
        metadata: entry.metadata,
        ipHash: await clientIpHash(),
      },
    });
  } catch (error) {
    // Never block the user's action on an audit write, but make it visible.
    logServerEvent("audit.write_failed", error);
  }
}
