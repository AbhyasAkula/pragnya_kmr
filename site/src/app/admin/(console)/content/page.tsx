import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { contentGroups, contentTitles } from "@/lib/admin/content-sections";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";

export const metadata: Metadata = { title: "Content" };

export default async function ContentIndexPage() {
  const user = await requireAdminPage();
  if (!can(user, "CONTENT")) return <AccessDenied feature="website content" />;
  const rows = await getDb().contentEntry.findMany({ select: { key: true, updatedAt: true } });
  const updated = new Map(rows.map((r) => [r.key, r.updatedAt]));

  return (
    <>
      <PageHeader title="Content" description="Edit the text and images on the website. Changes are published as soon as you save." />
      <div className="space-y-6">
        {contentGroups.map((g) => (
          <Card key={g.title}>
            <CardHeader title={g.title} description={g.description} />
            <ul className="divide-y divide-line">
              {g.items.map((i) => (
                <li key={i.key}>
                  <Link href={`/admin/content/${i.slug}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-canvas/70">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{contentTitles[i.key]}</p>
                      <p className="text-sm text-stone">{i.description}</p>
                      {updated.get(i.key) ? <p className="mt-0.5 text-xs text-stone/80">Last saved {formatDateTime(updated.get(i.key)!)}</p> : null}
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-stone" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        <p className="text-sm text-stone">
          Villas, the gallery and construction updates have their own sections in the menu. Contact details appear in the header, footer and booking form.
        </p>
      </div>
    </>
  );
}

