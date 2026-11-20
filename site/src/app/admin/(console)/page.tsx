import { AlertTriangle, CalendarDays, Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardHeader, EmptyState, LinkButton, Notice, PageHeader, Stat } from "@/components/admin/ui";
import {
  bookingReference,
  bookingStatus,
  BOOKING_STATUSES,
  formatDate,
  formatDateTime,
  formatVisitDate,
  istDayStart,
  nowMs,
  OPEN_STATUSES,
} from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage, type AdminUser } from "@/lib/admin/session";
import { todayInTimeZone } from "@/lib/dates";
import { isPlaceholderImage } from "@/lib/media";
import { getDb } from "@/lib/server/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const DAY = 86_400_000;

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireAdminPage();
  const { welcome } = await searchParams;
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const showWebsite = (["VILLAS", "GALLERY", "CONSTRUCTION", "CONTENT"] as const).some((p) => can(user, p));

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user.fullName.split(" ")[0]}`}
        description={new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date())}
      />
      {welcome ? (
        <Notice tone="success" className="mb-6">
          Your password is set and you&apos;re signed in. Welcome to the Aurelia dashboard.
        </Notice>
      ) : null}
      {can(user, "BOOKINGS") ? <BookingsOverview user={user} /> : null}
      {showWebsite ? <WebsiteHealth user={user} /> : null}
      {!can(user, "BOOKINGS") && !showWebsite ? (
        <Card>
          <EmptyState title="No sections assigned yet">Ask the owner to give you access to the parts of the dashboard you work on.</EmptyState>
        </Card>
      ) : null}
    </>
  );
}

async function BookingsOverview({ user }: { user: AdminUser }) {
  const db = getDb();
  const today = todayInTimeZone("Asia/Kolkata");
  const todayDate = new Date(`${today}T00:00:00Z`);
  const in7 = new Date(todayDate.getTime() + 7 * DAY);
  const tomorrowStart = istDayStart(new Date(todayDate.getTime() + DAY).toISOString().slice(0, 10));
  const now = nowMs();
  const open = { status: { in: OPEN_STATUSES } };

  const [newCount, last7, prev7, upcomingCount, dueCount, overdueCount, unassigned, mine, byStatus, recent, upcoming, followUps, villaInterest] =
    await Promise.all([
      db.siteVisitRequest.count({ where: { status: "NEW" } }),
      db.siteVisitRequest.count({ where: { createdAt: { gte: new Date(now - 7 * DAY) } } }),
      db.siteVisitRequest.count({ where: { createdAt: { gte: new Date(now - 14 * DAY), lt: new Date(now - 7 * DAY) } } }),
      db.siteVisitRequest.count({ where: { ...open, visitDate: { gte: todayDate, lt: in7 } } }),
      db.siteVisitRequest.count({ where: { ...open, followUpAt: { lt: tomorrowStart } } }),
      db.siteVisitRequest.count({ where: { ...open, followUpAt: { lt: istDayStart(today) } } }),
      db.siteVisitRequest.count({ where: { ...open, assignedToId: null } }),
      db.siteVisitRequest.count({ where: { ...open, assignedToId: user.id } }),
      db.siteVisitRequest.groupBy({ by: ["status"], _count: { _all: true } }),
      db.siteVisitRequest.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, villa: true, status: true, createdAt: true } }),
      db.siteVisitRequest.findMany({
        where: { ...open, visitDate: { gte: todayDate, lt: in7 } },
        orderBy: [{ visitDate: "asc" }, { createdAt: "asc" }],
        take: 8,
        select: { id: true, name: true, villa: true, status: true, visitDate: true, assignedTo: { select: { fullName: true } } },
      }),
      db.siteVisitRequest.findMany({
        where: { ...open, followUpAt: { lt: tomorrowStart } },
        orderBy: { followUpAt: "asc" },
        take: 8,
        select: { id: true, name: true, followUpAt: true, assignedTo: { select: { fullName: true } } },
      }),
      db.siteVisitRequest.groupBy({
        by: ["villa"],
        where: { createdAt: { gte: new Date(now - 90 * DAY) } },
        _count: { _all: true },
        orderBy: { _count: { villa: "desc" } },
      }),
    ]);

  const statusCount = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>;
  const total = Object.values(statusCount).reduce((a, b) => a + b, 0);
  const trend = last7 - prev7;
  const villaTotal = villaInterest.reduce((a, v) => a + v._count._all, 0);

  return (
    <section aria-labelledby="leads-heading" className="mb-10">
      <h2 id="leads-heading" className="sr-only">
        Bookings overview
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="New requests" value={newCount} hint="Waiting for first contact" href="/admin/bookings?status=NEW" tone={newCount > 0 ? "warning" : undefined} />
        <Stat
          label="Requests this week"
          value={last7}
          hint={prev7 === 0 && last7 === 0 ? "No requests in the last 14 days" : `${trend >= 0 ? "+" : ""}${trend} vs previous 7 days`}
          href="/admin/bookings?view=all"
        />
        <Stat label="Visits in next 7 days" value={upcomingCount} hint="Open requests" href="/admin/bookings?when=upcoming&sort=visit" />
        <Stat
          label="Follow-ups due"
          value={dueCount}
          hint={overdueCount ? `${overdueCount} overdue` : "None overdue"}
          href="/admin/bookings?followup=due&sort=followup"
          tone={overdueCount > 0 ? "danger" : undefined}
        />
      </div>

      {unassigned > 0 || mine > 0 ? (
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone">
          {unassigned > 0 ? (
            <Link href="/admin/bookings?assigned=none" className="inline-flex items-center gap-1.5 font-medium text-warning hover:underline">
              <AlertTriangle className="size-4" aria-hidden /> {unassigned} open {unassigned === 1 ? "request has" : "requests have"} no one assigned
            </Link>
          ) : null}
          {mine > 0 ? (
            <Link href="/admin/bookings?assigned=me" className="font-medium text-ink hover:underline">
              {mine} open {mine === 1 ? "request is" : "requests are"} assigned to you
            </Link>
          ) : null}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Upcoming visits" description="Preferred dates in the next 7 days (not yet confirmed unless marked)." actions={<LinkButton href="/admin/bookings?when=upcoming&sort=visit" variant="secondary" size="sm">View all</LinkButton>} />
          {upcoming.length === 0 ? (
            <EmptyState icon={<CalendarDays className="size-7" aria-hidden />} title="No visits requested for the next 7 days" />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-canvas/70">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{b.name}</p>
                      <p className="truncate text-sm text-stone">
                        {b.villa ?? "Villa not chosen"} · {b.assignedTo?.fullName ?? "Unassigned"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold whitespace-nowrap text-ink tabular-nums">{formatVisitDate(b.visitDate)}</p>
                      <Badge tone={bookingStatus[b.status].tone}>{bookingStatus[b.status].label}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Follow-ups due" />
          {followUps.length === 0 ? (
            <EmptyState title="You're all caught up">No follow-ups are due today.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {followUps.map((b) => {
                const overdue = b.followUpAt! < istDayStart(today);
                return (
                  <li key={b.id}>
                    <Link href={`/admin/bookings/${b.id}`} className="block px-5 py-3 hover:bg-canvas/70">
                      <p className="truncate font-semibold text-ink">{b.name}</p>
                      <p className={cn("text-sm", overdue ? "font-medium text-danger" : "text-stone")}>
                        {overdue ? "Overdue · " : ""}
                        {formatDateTime(b.followUpAt!)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent requests" actions={<LinkButton href="/admin/bookings?view=all" variant="secondary" size="sm">All bookings</LinkButton>} />
          {recent.length === 0 ? (
            <EmptyState icon={<Inbox className="size-7" aria-hidden />} title="No requests yet">
              Requests from the website&apos;s booking form appear here as soon as they are saved.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-canvas/70">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{b.name}</p>
                      <p className="truncate text-sm text-stone">
                        #{bookingReference(b.id)} · {b.villa ?? "Villa not chosen"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge tone={bookingStatus[b.status].tone}>{bookingStatus[b.status].label}</Badge>
                      <p className="mt-1 text-xs text-stone">{formatDate(b.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Pipeline" description={`${total} request${total === 1 ? "" : "s"} in total`} />
          <ul className="space-y-1 p-3">
            {BOOKING_STATUSES.map((s) => (
              <li key={s}>
                <Link href={`/admin/bookings?status=${s}`} className="flex min-h-10 items-center justify-between rounded-lg px-2 hover:bg-canvas">
                  <Badge tone={bookingStatus[s].tone}>{bookingStatus[s].label}</Badge>
                  <span className="font-semibold tabular-nums">{statusCount[s] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-5">
            <p className="text-sm font-semibold text-ink">Villa interest · last 90 days</p>
            {villaTotal === 0 ? (
              <p className="mt-1 text-sm text-stone">No requests in the last 90 days.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {villaInterest.map((v) => (
                  <li key={v.villa ?? "none"} className="flex justify-between gap-3">
                    <span className="truncate text-stone">{v.villa ?? "Not sure yet"}</span>
                    <span className="font-semibold tabular-nums">
                      {v._count._all} <span className="font-normal text-stone">({Math.round((v._count._all / villaTotal) * 100)}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

async function WebsiteHealth({ user }: { user: AdminUser }) {
  const db = getDb();
  const [villaDrafts, villasPublished, galleryDrafts, gallery, updateDrafts, latestUpdate, sampleUpdates] = await Promise.all([
    db.villa.count({ where: { status: "DRAFT" } }),
    db.villa.count({ where: { status: "PUBLISHED" } }),
    db.galleryItem.count({ where: { status: "DRAFT" } }),
    db.galleryItem.findMany({ where: { status: "PUBLISHED" }, select: { src: true } }),
    db.constructionUpdate.count({ where: { status: "DRAFT" } }),
    db.constructionUpdate.findFirst({ where: { status: "PUBLISHED", isSample: false }, orderBy: { date: "desc" }, select: { date: true } }),
    db.constructionUpdate.count({ where: { status: "PUBLISHED", isSample: true } }),
  ]);
  const placeholders = gallery.filter((g) => isPlaceholderImage(g.src)).length;
  const daysSinceUpdate = latestUpdate ? Math.floor((nowMs() - latestUpdate.date.getTime()) / DAY) : null;

  const items: { show: boolean; label: string; value: string; detail: string; href: string; attention: boolean }[] = [
    {
      show: can(user, "VILLAS"),
      label: "Villas",
      value: `${villasPublished} published`,
      detail: villaDrafts ? `${villaDrafts} draft${villaDrafts === 1 ? "" : "s"} not on the website` : "No drafts",
      href: "/admin/villas",
      attention: villaDrafts > 0,
    },
    {
      show: can(user, "GALLERY"),
      label: "Gallery",
      value: `${gallery.length} published`,
      detail: placeholders
        ? `${placeholders} still use stock placeholder images`
        : galleryDrafts
          ? `${galleryDrafts} draft${galleryDrafts === 1 ? "" : "s"}`
          : "All images are your own",
      href: "/admin/gallery",
      attention: placeholders > 0,
    },
    {
      show: can(user, "CONSTRUCTION"),
      label: "Construction updates",
      value: daysSinceUpdate === null ? "No real update yet" : `Last update ${daysSinceUpdate} days ago`,
      detail: sampleUpdates
        ? `${sampleUpdates} sample update${sampleUpdates === 1 ? " is" : "s are"} still published`
        : updateDrafts
          ? `${updateDrafts} draft${updateDrafts === 1 ? "" : "s"}`
          : "Up to date",
      href: "/admin/construction",
      attention: sampleUpdates > 0 || daysSinceUpdate === null || daysSinceUpdate > 45,
    },
  ];

  return (
    <section aria-labelledby="website-heading">
      <h2 id="website-heading" className="mb-3 font-sans text-base font-semibold text-ink">
        Website
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items
          .filter((i) => i.show)
          .map((i) => (
            <Link key={i.label} href={i.href} className="rounded-xl border border-line bg-panel p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] hover:border-gold/50 sm:p-5">
              <p className="text-sm font-medium text-stone">{i.label}</p>
              <p className="mt-1 font-semibold text-ink">{i.value}</p>
              <p className={cn("mt-1 flex items-center gap-1.5 text-sm", i.attention ? "text-warning" : "text-stone")}>
                {i.attention ? <AlertTriangle className="size-4 shrink-0" aria-hidden /> : null}
                {i.detail}
              </p>
            </Link>
          ))}
      </div>
    </section>
  );
}
