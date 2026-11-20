import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { VillaEditor } from "@/components/admin/editors";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/admin/forms";
import { AccessDenied, Badge, Card, CardHeader, LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { deleteVilla, saveVilla, setVillaStatus } from "../actions";

export const metadata: Metadata = { title: "Edit villa" };

export default async function EditVillaPage({ params, searchParams }: PageProps<"/admin/villas/[id]">) {
  const user = await requireAdminPage();
  if (!can(user, "VILLAS")) return <AccessDenied feature="villas" />;
  const { id } = await params;
  const sp = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const v = await getDb().villa.findUnique({ where: { id } });
  if (!v) notFound();
  const published = v.status === "PUBLISHED";

  const initial = {
    name: v.name,
    slug: v.slug,
    configuration: v.configuration,
    availability: v.availability,
    summary: v.summary,
    startingPrice: v.startingPrice,
    unitCount: v.unitCount,
    builtUpArea: v.builtUpArea,
    plotArea: v.plotArea,
    floors: v.floors,
    bedrooms: v.bedrooms,
    bathrooms: v.bathrooms,
    carParks: v.carParks,
    description: v.description,
    highlights: v.highlights,
    image: v.image,
    gallery: v.gallery,
    floorPlans: v.floorPlans,
  };

  return (
    <>
      <PageHeader
        back={{ href: "/admin/villas", label: "Villas" }}
        title={v.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={published ? "success" : "neutral"}>{published ? "Published" : "Draft"}</Badge>
            Last edited {formatDateTime(v.updatedAt)}
          </span>
        }
        actions={
          published ? (
            <LinkButton href={`/villas/${v.slug}`} target="_blank" variant="secondary">
              View on website <ExternalLink className="size-4" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </LinkButton>
          ) : null
        }
      />
      {sp.created ? (
        <Notice tone="success" className="mb-6">
          Draft created. Review it, then publish it below when it&apos;s ready.
        </Notice>
      ) : null}

      <Card className="mb-6">
        <CardHeader
          title="Publishing"
          description={published ? "This villa is live on the website. Saved changes appear immediately." : "This villa is a draft and isn't visible on the website."}
          actions={
            <>
              <ActionForm action={setVillaStatus} hideMessage>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="status" value={published ? "DRAFT" : "PUBLISHED"} />
                <SubmitButton variant={published ? "secondary" : "primary"} pendingLabel={published ? "Unpublishing…" : "Publishing…"}>
                  {published ? "Unpublish" : "Publish"}
                </SubmitButton>
              </ActionForm>
              <ConfirmAction
                action={deleteVilla}
                hidden={{ id: v.id }}
                trigger="Delete"
                title={`Delete ${v.name}?`}
                body={
                  published
                    ? "It will disappear from the website immediately, including its page, cards and the booking form. Existing bookings keep the villa name."
                    : "This draft will be permanently deleted."
                }
                confirmLabel="Delete villa"
              />
            </>
          }
        />
      </Card>

      <VillaEditor action={saveVilla} initial={initial} hidden={{ id: v.id }} submitLabel={published ? "Save & publish changes" : "Save draft"} />
    </>
  );
}
