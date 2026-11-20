import { HardHat, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied, Badge, Card, CardHeader, EmptyState, LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";

export const metadata: Metadata = { title: "Construction" };

const milestoneTone = { COMPLETED: "success", IN_PROGRESS: "info", UPCOMING: "neutral" } as const;
const milestoneLabel = { COMPLETED: "Completed", IN_PROGRESS: "In progress", UPCOMING: "Upcoming" } as const;

export default async function ConstructionPage({ searchParams }: PageProps<"/admin/construction">) {
  const user = await requireAdminPage();
  if (!can(user, "CONSTRUCTION")) return <AccessDenied feature="construction progress" />;
  const sp = await searchParams;
  const db = getDb();
  const [updates, milestones] = await Promise.all([
    db.constructionUpdate.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: { id: true, date: true, title: true, overallProgress: true, status: true, isSample: true, media: true },
    }),
    db.constructionMilestone.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);

  return (
    <>
      <PageHeader
        title="Construction progress"
        description="Dated site updates with photos, and the milestone timeline shown on /construction-progress."
        actions={
          <LinkButton href="/admin/construction/updates/new">
            <Plus className="size-4" aria-hidden /> New update
          </LinkButton>
        }
      />
      {sp.deleted ? <Notice tone="success" className="mb-4">The update was deleted.</Notice> : null}
      {updates.some((u) => u.isSample && u.status === "PUBLISHED") ? (
        <Notice tone="warning" className="mb-4">
          Sample updates are still published. Replace them with real site reports, then unpublish or delete the samples.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Updates" description="Newest first. The newest published update is featured on the website." />
          {updates.length === 0 ? (
            <EmptyState icon={<HardHat className="size-8" aria-hidden />} title="No updates yet" action={<LinkButton href="/admin/construction/updates/new">Write the first update</LinkButton>} />
          ) : (
            <ul className="divide-y divide-line">
              {updates.map((u) => {
                const media = u.media as { src: string }[];
                return (
                  <li key={u.id}>
                    <Link href={`/admin/construction/updates/${u.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-canvas/70">
                      {media[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                        <img src={media[0].src} alt="" className="h-14 w-20 shrink-0 rounded-md border border-line object-cover" />
                      ) : (
                        <span className="h-14 w-20 shrink-0 rounded-md border border-line bg-sand" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                          <span className="truncate">{u.title}</span>
                          <Badge tone={u.status === "PUBLISHED" ? "success" : "neutral"}>{u.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
                          {u.isSample ? <Badge tone="warning">Sample</Badge> : null}
                        </p>
                        <p className="text-sm text-stone">
                          {formatDate(u.date.toISOString().slice(0, 10))} · {u.overallProgress}% overall · {media.length} photo{media.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Milestones" actions={<LinkButton href="/admin/construction/milestones" variant="secondary" size="sm">Edit</LinkButton>} />
          {milestones.length === 0 ? (
            <EmptyState title="No milestones yet" />
          ) : (
            <ol className="divide-y divide-line">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className={m.visible ? "font-medium text-ink" : "font-medium text-stone line-through"}>{m.title}</p>
                    <p className="text-xs text-stone">{m.dateLabel}{m.visible ? "" : " · hidden"}</p>
                  </div>
                  <Badge tone={milestoneTone[m.status]}>{milestoneLabel[m.status]}</Badge>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
