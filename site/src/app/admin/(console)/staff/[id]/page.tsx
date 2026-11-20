import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ConfirmAction } from "@/components/admin/forms";
import { AccessLinkButton, StaffForm } from "@/components/admin/staff-forms";
import { AccessDenied, Badge, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { createAccessLink, setStaffStatus, updateStaff } from "../actions";

export const metadata: Metadata = { title: "Staff member" };

const statusTone = { ACTIVE: "success", INVITED: "warning", DISABLED: "danger" } as const;
const statusLabel = { ACTIVE: "Active", INVITED: "Invited — hasn't set a password yet", DISABLED: "Disabled" } as const;

export default async function StaffMemberPage({ params }: PageProps<"/admin/staff/[id]">) {
  const user = await requireAdminPage();
  if (!can(user, "OWNER")) return <AccessDenied feature="staff management" />;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = getDb();
  const s = await db.staffMember.findUnique({ where: { id } });
  if (!s) notFound();
  const [openLeads, recent] = await Promise.all([
    db.siteVisitRequest.count({ where: { assignedToId: s.id, status: { in: ["NEW", "CONTACTED", "CONFIRMED"] } } }),
    db.auditLog.findMany({ where: { actorId: s.id }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, summary: true, createdAt: true } }),
  ]);
  const self = s.id === user.id;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/staff", label: "Staff" }}
        title={s.fullName}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[s.status]}>{statusLabel[s.status]}</Badge>
            {s.lastSignInAt ? `Last sign-in ${formatDateTime(s.lastSignInAt)}` : null}
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Role & access" description="Changes take effect immediately, even if they're signed in." />
          <StaffForm
            action={updateStaff}
            mode="edit"
            hidden={{ id: s.id }}
            lockRole={self}
            initial={{ fullName: s.fullName, email: s.email, role: s.role, permissions: s.permissions }}
          />
        </Card>
        <div className="space-y-6">
          {s.status !== "DISABLED" ? (
            <Card>
              <CardHeader
                title={s.status === "INVITED" ? "Invitation" : "Password reset"}
                description={
                  s.status === "INVITED"
                    ? "Create a fresh invitation link if the first one expired."
                    : "If they forgot their password, create a reset link and send it to them."
                }
              />
              <div className="p-5">
                <AccessLinkButton action={createAccessLink} id={s.id} label={s.status === "INVITED" ? "New invitation link" : "Create reset link"} />
              </div>
            </Card>
          ) : null}
          {!self ? (
            <Card>
              <CardHeader
                title={s.status === "DISABLED" ? "Account disabled" : "Disable account"}
                description={
                  s.status === "DISABLED"
                    ? `Disabled ${s.disabledAt ? formatDateTime(s.disabledAt) : ""}. Their data and history are kept.`
                    : "Signs them out everywhere and blocks sign-in. History is kept; you can re-enable later."
                }
              />
              <div className="p-5">
                <ConfirmAction
                  action={setStaffStatus}
                  hidden={{ id: s.id, action: s.status === "DISABLED" ? "enable" : "disable" }}
                  trigger={s.status === "DISABLED" ? "Re-enable account" : "Disable account"}
                  variant={s.status === "DISABLED" ? "primary" : "danger"}
                  title={s.status === "DISABLED" ? `Re-enable ${s.fullName}?` : `Disable ${s.fullName}?`}
                  body={
                    s.status === "DISABLED"
                      ? "They'll be able to sign in again with their existing password."
                      : `They'll lose access immediately.${openLeads ? ` ${openLeads} open booking${openLeads === 1 ? " is" : "s are"} assigned to them — reassign ${openLeads === 1 ? "it" : "them"} afterwards.` : ""}`
                  }
                  confirmLabel={s.status === "DISABLED" ? "Re-enable" : "Disable account"}
                />
              </div>
            </Card>
          ) : null}
          <Card>
            <CardHeader title="Recent activity" />
            {recent.length === 0 ? (
              <p className="p-5 text-sm text-stone">No recorded activity yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((r) => (
                  <li key={r.id} className="px-5 py-2.5 text-sm">
                    <p className="text-ink">{r.summary}</p>
                    <p className="text-xs text-stone">{formatDateTime(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
