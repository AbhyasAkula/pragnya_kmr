import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { GalleryItemEditor } from "@/components/admin/editors";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/admin/forms";
import { AccessDenied, Badge, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { deleteGalleryItem, saveGalleryItem, setGalleryStatus } from "../actions";

export const metadata: Metadata = { title: "Edit gallery item" };

export default async function GalleryItemPage({ params }: PageProps<"/admin/gallery/[id]">) {
  const user = await requireAdminPage();
  if (!can(user, "GALLERY")) return <AccessDenied feature="the gallery" />;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const g = await getDb().galleryItem.findUnique({ where: { id } });
  if (!g) notFound();
  const published = g.status === "PUBLISHED";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/gallery", label: "Gallery" }}
        title={g.caption}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={published ? "success" : "neutral"}>{published ? "Published" : "Draft"}</Badge>
            Last edited {formatDateTime(g.updatedAt)}
          </span>
        }
      />
      <Card className="mb-6">
        <CardHeader
          title="Publishing"
          description={published ? "Visible on /gallery." : "Draft — not visible on the website."}
          actions={
            <>
              <ActionForm action={setGalleryStatus} hideMessage>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="status" value={published ? "DRAFT" : "PUBLISHED"} />
                <SubmitButton variant={published ? "secondary" : "primary"}>{published ? "Unpublish" : "Publish"}</SubmitButton>
              </ActionForm>
              <ConfirmAction
                action={deleteGalleryItem}
                hidden={{ id: g.id }}
                trigger="Delete"
                title="Delete this image?"
                body="It will be removed from the gallery. If the uploaded file isn't used anywhere else, it is deleted from storage too."
                confirmLabel="Delete image"
              />
            </>
          }
        />
      </Card>
      <GalleryItemEditor
        action={saveGalleryItem}
        hidden={{ id: g.id }}
        initial={{
          image: { src: g.src, alt: g.alt },
          caption: g.caption,
          category: g.category,
          source: g.source,
          featured: g.featured,
          kind: g.kind,
          videoUrl: g.videoUrl ?? "",
          videoDuration: g.videoDuration ?? "",
        }}
      />
    </>
  );
}
