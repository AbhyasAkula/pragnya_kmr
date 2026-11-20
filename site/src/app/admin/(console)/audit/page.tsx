import { ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { AccessDenied, Badge, btn, Card, EmptyState, inputClass, PageHeader, Pagination } from "@/components/admin/ui";
import { formatDateTime, istDayStart } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 50;
const AREAS: Record<string, string> = {
  auth: "Sign-in",
  staff: "Staff",
  booking: "Bookings",
  villa: "Villas",
  gallery: "Gallery",
  construction_update: "Construction updates",
  construction_milestone: "Milestones",
  content: "Content & settings",
  media: "Images",
};
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().slice(0, 80) : "");

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const user = await requireAdminPage();
  if (!can(user, "AUDIT_LOG")) return <AccessDenied feature="the audit log" />;
  const sp = await searchParams;
  const actor = str(sp.actor);
  const area = str(sp.area) in AREAS ? str(sp.area) : "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(str(sp.from)) ? str(sp.from) : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(str(sp.to)) ? str(sp.to) : "";
  const page = Math.max(1, Number.parseInt(str(sp.page) || "1", 10) || 1);

  const where: Prisma.AuditLogWhereInput = {};
  if (/^[0-9a-f-]{36}$/i.test(actor)) where.actorId = actor;
  if (actor === "system") where.actorId = null;
  if (area) where.entityType = area;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: istDayStart(from) } : {}),
      ...(to ? { lt: new Date(istDayStart(to).getTime() + 86_400_000) } : {}),
    };
  }

  const db = getDb();
  const [total, rows, staff] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.staffMember.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
  ]);
  const names = new Map(staff.map((s) => [s.id, s.fullName]));
  const hrefFor = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ actor, area, from, to })) if (v) q.set(k, v);
    if (p > 1) q.set("page", String(p));
    return `/admin/audit${q.size ? `?${q}` : ""}`;
  };
  const filtered = Boolean(actor || area || from || to);

  return (
    <>
      <PageHeader title="Audit log" description="A permanent record of important actions in the dashboard. Entries can't be edited or deleted." />
      <Card className="mb-4">
        <form method="get" className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Filter audit log">
          <div>
            <label htmlFor="actor" className="mb-1 block text-xs font-semibold text-stone">Who</label>
            <select id="actor" name="actor" defaultValue={actor} className={inputClass}>
              <option value="">Everyone</option>
              <option value="system">Not signed in / system</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="area" className="mb-1 block text-xs font-semibold text-stone">Area</label>
            <select id="area" name="area" defaultValue={area} className={inputClass}>
              <option value="">All areas</option>
              {Object.entries(AREAS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="from" className="mb-1 block text-xs font-semibold text-stone">From</label>
            <input id="from" name="from" type="date" defaultValue={from} className={inputClass} />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-xs font-semibold text-stone">To</label>
            <input id="to" name="to" type="date" defaultValue={to} className={inputClass} />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className={btn({ className: "flex-1" })}>Apply</button>
            {filtered ? (
              <Link href="/admin/audit" className={btn({ variant: "secondary", className: "flex-1" })}>
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={<ScrollText className="size-8" aria-hidden />} title="No entries" />
        ) : (
          <ol className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
                <time dateTime={r.createdAt.toISOString()} className="text-sm text-stone tabular-nums">
                  {formatDateTime(r.createdAt)}
                </time>
                <div className="min-w-0">
                  <p className="text-[0.9375rem] text-ink">{r.summary}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone">
                    <span className="font-semibold">{r.actorId ? names.get(r.actorId) ?? r.actorEmail ?? "Former staff" : "Not signed in"}</span>
                    {r.actorRole ? <Badge tone="neutral">{r.actorRole === "OWNER" ? "Owner" : "Staff"}</Badge> : null}
                    <code className="rounded bg-sand px-1">{r.action}</code>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))} total={total} hrefFor={hrefFor} label="entries" />
      </Card>
    </>
  );
}
