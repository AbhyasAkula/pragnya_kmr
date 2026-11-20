import { Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied, Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/format";
import { can, PERMISSION_INFO } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";

export const metadata: Metadata = { title: "Staff" };

const statusTone = { ACTIVE: "success", INVITED: "warning", DISABLED: "danger" } as const;
const statusLabel = { ACTIVE: "Active", INVITED: "Invited", DISABLED: "Disabled" } as const;

export default async function StaffPage() {
  const user = await requireAdminPage();
  if (!can(user, "OWNER")) return <AccessDenied feature="staff management" />;
  const staff = await getDb().staffMember.findMany({ orderBy: [{ status: "asc" }, { role: "asc" }, { fullName: "asc" }] });

  return (
    <>
      <PageHeader
        title="Staff"
        description="Accounts are invite-only. Owners have full access; staff see only the areas you grant."
        actions={
          <LinkButton href="/admin/staff/new">
            <Plus className="size-4" aria-hidden /> Invite staff member
          </LinkButton>
        }
      />
      <Card>
        {staff.length === 0 ? (
          <EmptyState icon={<Users className="size-8" aria-hidden />} title="No staff accounts" />
        ) : (
          <ul className="divide-y divide-line">
            {staff.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/staff/${s.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-canvas/70 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                      {s.fullName}
                      {s.id === user.id ? <span className="text-sm font-normal text-stone">(you)</span> : null}
                      <Badge tone={s.role === "OWNER" ? "gold" : "neutral"}>{s.role === "OWNER" ? "Owner" : "Staff"}</Badge>
                      <Badge tone={statusTone[s.status]}>{statusLabel[s.status]}</Badge>
                    </p>
                    <p className="truncate text-sm text-stone">{s.email}</p>
                    <p className="mt-0.5 text-xs text-stone">
                      {s.role === "OWNER" ? "All areas" : s.permissions.map((p) => PERMISSION_INFO[p].label).join(" · ") || "No access"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-stone">
                    {s.lastSignInAt ? `Last sign-in ${formatDateTime(s.lastSignInAt)}` : s.status === "INVITED" ? "Hasn't accepted yet" : "Never signed in"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
