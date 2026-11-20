import { ArrowDown, ArrowUp, Building2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AccessDenied, Badge, Card, EmptyState, LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { formatPriceINR } from "@/lib/utils";
import { moveVilla } from "./actions";

export const metadata: Metadata = { title: "Villas" };

const availabilityLabel = { AVAILABLE: "Available", LIMITED: "Limited", SOLD_OUT: "Sold out" } as const;

export default async function VillasPage({ searchParams }: PageProps<"/admin/villas">) {
  const user = await requireAdminPage();
  if (!can(user, "VILLAS")) return <AccessDenied feature="villas" />;
  const sp = await searchParams;
  const villas = await getDb().villa.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, slug: true, configuration: true, startingPrice: true, unitCount: true, availability: true, status: true, image: true, updatedAt: true },
  });

  return (
    <>
      <PageHeader
        title="Villas"
        description="Villa models shown on the homepage, the villas page and the booking form. Drafts are never shown on the website."
        actions={
          <>
            <LinkButton href="/admin/villas/specifications" variant="secondary">
              Specifications
            </LinkButton>
            <LinkButton href="/admin/villas/new">
              <Plus className="size-4" aria-hidden /> New villa
            </LinkButton>
          </>
        }
      />
      {sp.deleted ? <Notice tone="success" className="mb-4">The villa was deleted.</Notice> : null}
      <Card>
        {villas.length === 0 ? (
          <EmptyState icon={<Building2 className="size-8" aria-hidden />} title="No villas yet" action={<LinkButton href="/admin/villas/new">Add the first villa</LinkButton>}>
            Published villas appear on the website in the order shown here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {villas.map((v, i) => {
              const image = v.image as { src: string; alt: string };
              return (
                <li key={v.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <Link href={`/admin/villas/${v.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                    <img src={image.src} alt="" className="h-16 w-24 shrink-0 rounded-md border border-line object-cover" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                        {v.name}
                        <Badge tone={v.status === "PUBLISHED" ? "success" : "neutral"}>{v.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
                      </p>
                      <p className="text-sm text-stone">
                        {v.configuration} · from {formatPriceINR(v.startingPrice)} · {v.unitCount} homes · {availabilityLabel[v.availability]}
                      </p>
                      <p className="text-xs text-stone/80">/villas/{v.slug} · edited {formatDateTime(v.updatedAt)}</p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                    <ActionForm action={moveVilla} hideMessage>
                      <input type="hidden" name="id" value={v.id} />
                      <input type="hidden" name="dir" value="up" />
                      <SubmitButton variant="ghost" size="sm" disabled={i === 0} aria-label={`Move ${v.name} up`} pendingLabel="">
                        <ArrowUp className="size-4" aria-hidden />
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={moveVilla} hideMessage>
                      <input type="hidden" name="id" value={v.id} />
                      <input type="hidden" name="dir" value="down" />
                      <SubmitButton variant="ghost" size="sm" disabled={i === villas.length - 1} aria-label={`Move ${v.name} down`} pendingLabel="">
                        <ArrowDown className="size-4" aria-hidden />
                      </SubmitButton>
                    </ActionForm>
                    <LinkButton href={`/admin/villas/${v.id}`} variant="secondary" size="sm">
                      Edit
                    </LinkButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
