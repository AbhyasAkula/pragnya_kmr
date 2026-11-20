import type { Metadata } from "next";
import { MilestonesEditor } from "@/components/admin/editors";
import { AccessDenied, PageHeader } from "@/components/admin/ui";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { saveMilestones } from "../actions";

export const metadata: Metadata = { title: "Milestones" };

export default async function MilestonesPage() {
  const user = await requireAdminPage();
  if (!can(user, "CONSTRUCTION")) return <AccessDenied feature="construction progress" />;
  const milestones = await getDb().constructionMilestone.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return (
    <>
      <PageHeader
        back={{ href: "/admin/construction", label: "Construction" }}
        title="Milestones"
        description="Tip: “{possession}” in a date fills in the possession date from Project details."
      />
      <MilestonesEditor
        action={saveMilestones}
        initial={{ milestones: milestones.map((m) => ({ id: m.id, title: m.title, status: m.status, dateLabel: m.dateLabel, visible: m.visible })) }}
      />
    </>
  );
}
