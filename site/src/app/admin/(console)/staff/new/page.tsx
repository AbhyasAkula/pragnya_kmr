import type { Metadata } from "next";
import { StaffForm } from "@/components/admin/staff-forms";
import { AccessDenied, Card, PageHeader } from "@/components/admin/ui";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { inviteStaff } from "../actions";

export const metadata: Metadata = { title: "Invite staff member" };

export default async function InviteStaffPage() {
  const user = await requireAdminPage();
  if (!can(user, "OWNER")) return <AccessDenied feature="staff management" />;
  return (
    <>
      <PageHeader
        back={{ href: "/admin/staff", label: "Staff" }}
        title="Invite staff member"
        description="You'll get a one-time link to send them. They choose their own password — you never see it."
      />
      <Card className="max-w-3xl">
        <StaffForm action={inviteStaff} mode="invite" initial={{ fullName: "", email: "", role: "STAFF", permissions: ["BOOKINGS"] }} />
      </Card>
    </>
  );
}
