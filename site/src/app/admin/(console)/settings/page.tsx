import type { Metadata } from "next";
import { ContentEditor } from "@/components/admin/editors";
import { AccessDenied, Notice, PageHeader } from "@/components/admin/ui";
import { getContentForEdit } from "@/lib/admin/content-store";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { saveContent } from "../content/actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireAdminPage();
  if (!can(user, "SETTINGS")) return <AccessDenied feature="settings" />;
  const { value, updatedAt, updatedBy } = await getContentForEdit("settings");

  return (
    <>
      <PageHeader
        title="Settings"
        description={updatedAt ? `Last saved ${formatDateTime(updatedAt)}${updatedBy ? ` by ${updatedBy}` : ""}.` : "Business settings for the website."}
      />
      {!value.acceptingOnlineBookings ? (
        <Notice tone="warning" className="mb-6">
          Online bookings are switched off. Visitors are asked to call or WhatsApp instead.
        </Notice>
      ) : null}
      <ContentEditor contentKey="settings" action={saveContent} initial={{ ...value, privacyPolicyUrl: value.privacyPolicyUrl ?? "" }} />
    </>
  );
}
