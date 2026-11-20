import type { Metadata } from "next";
import { ConstructionUpdateEditor } from "@/components/admin/editors";
import { AccessDenied, PageHeader } from "@/components/admin/ui";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { todayInTimeZone } from "@/lib/dates";
import { saveUpdate } from "../../actions";

export const metadata: Metadata = { title: "New construction update" };

export default async function NewUpdatePage() {
  const user = await requireAdminPage();
  if (!can(user, "CONSTRUCTION")) return <AccessDenied feature="construction progress" />;
  const initial = {
    date: todayInTimeZone("Asia/Kolkata"),
    title: "",
    summary: "",
    overallProgress: null,
    areas: [],
    media: [],
    isSample: false,
  };
  return (
    <>
      <PageHeader back={{ href: "/admin/construction", label: "Construction" }} title="New construction update" description="Saved as a draft. Publish it when it's ready." />
      <ConstructionUpdateEditor action={saveUpdate} initial={initial} submitLabel="Create draft" />
    </>
  );
}
