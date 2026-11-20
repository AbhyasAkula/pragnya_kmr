import { CalendarCheck, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { AccessDenied, Badge, btn, Card, EmptyState, inputClass, Notice, PageHeader, Pagination } from "@/components/admin/ui";
import {
  BOOKING_STATUSES,
  bookingReference,
  bookingStatus,
  formatDate,
  formatPhone,
  formatVisitDate,
  istDayStart,
  OPEN_STATUSES,
  type BookingStatus,
} from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { todayInTimeZone } from "@/lib/dates";
import { getDb } from "@/lib/server/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bookings" };

const PAGE_SIZE = 20;
const SORTS = {
  newest: { label: "Newest first", orderBy: [{ createdAt: "desc" }] },
  oldest: { label: "Oldest first", orderBy: [{ createdAt: "asc" }] },
  visit: { label: "Visit date (soonest)", orderBy: [{ visitDate: "asc" }, { createdAt: "asc" }] },
  followup: { label: "Follow-up (soonest)", orderBy: [{ followUpAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }] },
} satisfies Record<string, { label: string; orderBy: Prisma.SiteVisitRequestOrderByWithRelationInput[] }>;
type SortKey = keyof typeof SORTS;

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim().slice(0, 100) : "");

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  const user = await requireAdminPage();
  if (!can(user, "BOOKINGS")) return <AccessDenied feature="bookings" />;
  const sp = await searchParams;

  const q = str(sp.q);
  const status = BOOKING_STATUSES.includes(str(sp.status) as BookingStatus) ? (str(sp.status) as BookingStatus) : "";
  const view = ["open", "all", ""].includes(str(sp.view)) ? str(sp.view) || "open" : "open";
  const villa = str(sp.villa);
  const assigned = str(sp.assigned);
  const followUp = ["due", "overdue"].includes(str(sp.followup)) ? str(sp.followup) : "";
  const when = ["upcoming", "past"].includes(str(sp.when)) ? str(sp.when) : "";
  const sort: SortKey = str(sp.sort) in SORTS ? (str(sp.sort) as SortKey) : "newest";
  const page = Math.max(1, Math.min(10_000, Number.parseInt(str(sp.page) || "1", 10) || 1));

  const today = todayInTimeZone("Asia/Kolkata");
  const todayDate = new Date(`${today}T00:00:00Z`);
  const tomorrowStart = istDayStart(new Date(todayDate.getTime() + 86_400_000).toISOString().slice(0, 10));
  const db = getDb();

  const where: Prisma.SiteVisitRequestWhereInput = { AND: [] };
  const and = where.AND as Prisma.SiteVisitRequestWhereInput[];
  if (status) and.push({ status });
  else if (view === "open") and.push({ status: { in: OPEN_STATUSES } });
  if (villa) and.push(villa === "none" ? { villa: null } : { villa });
  if (assigned === "me") and.push({ assignedToId: user.id });
  else if (assigned === "none") and.push({ assignedToId: null });
  else if (/^[0-9a-f-]{36}$/i.test(assigned)) and.push({ assignedToId: assigned });
  if (followUp === "due") and.push({ followUpAt: { lt: tomorrowStart } });
  if (followUp === "overdue") and.push({ followUpAt: { lt: istDayStart(today) } });
  if (when === "upcoming") and.push({ visitDate: { gte: todayDate } });
  if (when === "past") and.push({ visitDate: { lt: todayDate } });
  if (q) {
    const digits = q.replace(/\D/g, "");
    const or: Prisma.SiteVisitRequestWhereInput[] = [{ name: { contains: q, mode: "insensitive" } }];
    if (digits.length >= 4) or.push({ phone: { contains: digits } });
    if (/^[0-9a-f]{6,8}$/i.test(q)) {
      const ids = await db.$queryRaw<{ id: string }[]>`
        SELECT id::text FROM "aurelia"."site_visit_requests" WHERE replace(id::text, '-', '') LIKE ${`%${q.toLowerCase()}`} LIMIT 20`;
      if (ids.length) or.push({ id: { in: ids.map((r) => r.id) } });
    }
    and.push({ OR: or });
  }

  const [total, rows, villas, staff] = await Promise.all([
    db.siteVisitRequest.count({ where }),
    db.siteVisitRequest.findMany({
      where,
      orderBy: SORTS[sort].orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        visitDate: true,
        villa: true,
        status: true,
        followUpAt: true,
        createdAt: true,
        assignedTo: { select: { fullName: true } },
      },
    }),
    db.siteVisitRequest.findMany({ distinct: ["villa"], where: { villa: { not: null } }, select: { villa: true }, orderBy: { villa: "asc" } }),
    db.staffMember.findMany({ where: { status: "ACTIVE" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtersActive = Boolean(q || status || villa || assigned || followUp || when || view === "all");

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, status, view: view === "open" ? "" : view, villa, assigned, followup: followUp, when, sort: sort === "newest" ? "" : sort })) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/bookings${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Bookings" description="Site-visit requests from the website. New requests are not confirmed visits until your team confirms them with the customer." />
      {sp.deleted ? <Notice tone="success" className="mb-4">The booking was permanently deleted.</Notice> : null}

      {/* Filters: plain GET form, works without JavaScript and keeps the URL shareable. */}
      <Card className="mb-4">
        <form method="get" action="/admin/bookings" className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search" aria-label="Filter bookings">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="q" className="sr-only">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone" aria-hidden />
              <input id="q" name="q" defaultValue={q} placeholder="Name, phone or reference" className={cn(inputClass, "pl-9")} />
            </div>
          </div>
          <FilterSelect id="status" label="Status" value={status} options={[{ value: "", label: "Any status" }, ...BOOKING_STATUSES.map((s) => ({ value: s, label: bookingStatus[s].label }))]} />
          <FilterSelect
            id="view"
            label="Show"
            value={view}
            options={[
              { value: "open", label: "Open only" },
              { value: "all", label: "Open and closed" },
            ]}
          />
          <FilterSelect
            id="assigned"
            label="Assigned to"
            value={assigned}
            options={[{ value: "", label: "Anyone" }, { value: "me", label: "Me" }, { value: "none", label: "Unassigned" }, ...staff.map((s) => ({ value: s.id, label: s.fullName }))]}
          />
          <FilterSelect id="villa" label="Villa" value={villa} options={[{ value: "", label: "Any villa" }, { value: "none", label: "Not sure yet" }, ...villas.map((v) => ({ value: v.villa!, label: v.villa! }))]} />
          <FilterSelect
            id="when"
            label="Visit date"
            value={when}
            options={[
              { value: "", label: "Any visit date" },
              { value: "upcoming", label: "Today or later" },
              { value: "past", label: "In the past" },
            ]}
          />
          <FilterSelect
            id="followup"
            label="Follow-up"
            value={followUp}
            options={[
              { value: "", label: "Any follow-up" },
              { value: "due", label: "Due today or earlier" },
              { value: "overdue", label: "Overdue" },
            ]}
          />
          <FilterSelect id="sort" label="Sort" value={sort} options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))} />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
            <button type="submit" className={btn({ className: "flex-1 lg:flex-none" })}>
              Apply
            </button>
            {filtersActive ? (
              <Link href="/admin/bookings" className={btn({ variant: "secondary", className: "flex-1 lg:flex-none" })}>
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={<CalendarCheck className="size-8" aria-hidden />} title={filtersActive ? "No bookings match these filters" : "No open bookings"}>
            {filtersActive ? "Try clearing some filters." : "New requests from the website's booking form will appear here."}
          </EmptyState>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Bookings, {SORTS[sort].label.toLowerCase()}</caption>
                <thead className="border-b border-line text-xs font-semibold tracking-wide text-stone uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">Customer</th>
                    <th scope="col" className="px-4 py-3">Preferred visit</th>
                    <th scope="col" className="px-4 py-3">Villa</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Assigned</th>
                    <th scope="col" className="px-4 py-3">Follow-up</th>
                    <th scope="col" className="px-4 py-3">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => {
                    const overdue = r.followUpAt && r.followUpAt < tomorrowStart && OPEN_STATUSES.includes(r.status);
                    return (
                      <tr key={r.id} className="group hover:bg-canvas/70">
                        <td className="px-4 py-3">
                          <Link href={`/admin/bookings/${r.id}`} className="font-semibold text-ink underline-offset-2 group-hover:underline">
                            {r.name}
                          </Link>
                          <p className="text-xs text-stone tabular-nums">
                            {formatPhone(r.phone)} · #{bookingReference(r.id)}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatVisitDate(r.visitDate)}</td>
                        <td className="px-4 py-3">{r.villa ?? <span className="text-stone">Not sure yet</span>}</td>
                        <td className="px-4 py-3">
                          <Badge tone={bookingStatus[r.status].tone}>{bookingStatus[r.status].label}</Badge>
                        </td>
                        <td className="px-4 py-3">{r.assignedTo?.fullName ?? <span className="text-stone">—</span>}</td>
                        <td className={cn("px-4 py-3 whitespace-nowrap", overdue ? "font-semibold text-danger" : "text-stone")}>
                          {r.followUpAt ? formatDate(r.followUpAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-stone">{formatDate(r.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/bookings/${r.id}`} className="block px-4 py-3.5 active:bg-canvas">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{r.name}</p>
                      <Badge tone={bookingStatus[r.status].tone}>{bookingStatus[r.status].label}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-stone tabular-nums">{formatPhone(r.phone)}</p>
                    <p className="mt-1 text-sm text-ink">
                      Visit {formatVisitDate(r.visitDate)}
                      {r.villa ? ` · ${r.villa}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-stone">
                      {r.assignedTo ? `Assigned to ${r.assignedTo.fullName}` : "Unassigned"} · received {formatDate(r.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <Pagination page={page} pageCount={pageCount} total={total} hrefFor={hrefFor} label={total === 1 ? "booking" : "bookings"} />
      </Card>
    </>
  );
}

function FilterSelect({ id, label, value, options }: { id: string; label: string; value: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} name={id} defaultValue={value} className={inputClass} aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
