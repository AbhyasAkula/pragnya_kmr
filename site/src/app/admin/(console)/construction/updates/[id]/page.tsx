import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ConstructionUpdateEditor } from "@/components/admin/editors";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/admin/forms";
import { AccessDenied, Badge, Card, CardHeader, Notice, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { deleteUpdate, saveUpdate, setUpdateStatus } from "../../actions";

export const metadata: Metadata = { title: "Edit construction update" };

export default async function EditUpdatePage({ params, searchParams }: PageProps<"/admin/construction/updates/[id]">) {
  const user = await requireAdminPage();
  if (!can(user, "CONSTRUCTION")) return <AccessDenied feature="construction progress" />;
  const { id } = await params;
  const sp = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const u = await getDb().constructionUpdate.findUnique({ where: { id } });
  if (!u) notFound();
  const published = u.status === "PUBLISHED";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/construction", label: "Construction" }}
        title={u.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={published ? "success" : "neutral"}>{published ? "Published" : "Draft"}</Badge>
            {u.isSample ? <Badge tone="warning">Sample</Badge> : null}
            Last edited {formatDateTime(u.updatedAt)}
          </span>
        }
      />
      {sp.created ? <Notice tone="success" className="mb-6">Draft created. Publish it below when it&apos;s ready.</Notice> : null}
      <Card className="mb-6">
        <CardHeader
          title="Publishing"
          description={published ? "Live on /construction-progress." : "Draft — not visible on the website."}
          actions={
            <>
              <ActionForm action={setUpdateStatus} hideMessage>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="status" value={published ? "DRAFT" : "PUBLISHED"} />
                <SubmitButton variant={published ? "secondary" : "primary"}>{published ? "Unpublish" : "Publish"}</SubmitButton>
              </ActionForm>
              <ConfirmAction
                action={deleteUpdate}
                hidden={{ id: u.id }}
                trigger="Delete"
                title="Delete this update?"
                body={published ? "It will be removed from the website immediately." : "This draft will be permanently deleted."}
                confirmLabel="Delete update"
              />
            </>
          }
        />
      </Card>
      <ConstructionUpdateEditor
        action={saveUpdate}
        hidden={{ id: u.id }}
        initial={{
          date: u.date.toISOString().slice(0, 10),
          title: u.title,
          summary: u.summary,
          overallProgress: u.overallProgress,
          areas: u.areas,
          media: u.media,
          isSample: u.isSample,
        }}
        submitLabel={published ? "Save & publish changes" : "Save draft"}
      />
    </>
  );
}
