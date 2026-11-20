import type { Metadata } from "next";
import { ContentEditor } from "@/components/admin/editors";
import { AccessDenied, PageHeader } from "@/components/admin/ui";
import { getContentForEdit } from "@/lib/admin/content-store";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { saveContent } from "../../content/actions";

export const metadata: Metadata = { title: "Gallery notice" };

export default async function GalleryNoticePage() {
  const user = await requireAdminPage();
  if (!can(user, "GALLERY")) return <AccessDenied feature="the gallery" />;
  const { value } = await getContentForEdit("gallery.page");
  return (
    <>
      <PageHeader back={{ href: "/admin/gallery", label: "Gallery" }} title="Gallery page notice" />
      <ContentEditor contentKey="gallery.page" action={saveContent} initial={value as Record<string, unknown>} />
    </>
  );
}
