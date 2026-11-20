import type { Metadata } from "next";
import { ContentEditor } from "@/components/admin/editors";
import { AccessDenied, PageHeader } from "@/components/admin/ui";
import { getContentForEdit } from "@/lib/admin/content-store";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { saveContent } from "../../content/actions";

export const metadata: Metadata = { title: "Villa specifications" };

export default async function SpecificationsPage() {
  const user = await requireAdminPage();
  if (!can(user, "VILLAS")) return <AccessDenied feature="villas" />;
  const { value, updatedAt, updatedBy } = await getContentForEdit("villas.specifications");
  return (
    <>
      <PageHeader
        back={{ href: "/admin/villas", label: "Villas" }}
        title="Villa specifications"
        description={updatedAt ? `Shared by every villa page. Last saved ${formatDateTime(updatedAt)}${updatedBy ? ` by ${updatedBy}` : ""}.` : "Shared by every villa page."}
      />
      <ContentEditor contentKey="villas.specifications" action={saveContent} initial={value as Record<string, unknown>} />
    </>
  );
}
