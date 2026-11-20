import type { ReactNode } from "react";
import { AdminShell, type NavKey } from "@/components/admin/admin-shell";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { signOut } from "../(auth)/actions";

/** Authenticated dashboard chrome. Navigation lists only permitted sections. */
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPage();
  const allowed: NavKey[] = ["dashboard"];
  if (can(user, "BOOKINGS")) allowed.push("bookings");
  if (can(user, "VILLAS")) allowed.push("villas");
  if (can(user, "GALLERY")) allowed.push("gallery");
  if (can(user, "CONSTRUCTION")) allowed.push("construction");
  if (can(user, "CONTENT")) allowed.push("content");
  if (can(user, "OWNER")) allowed.push("staff");
  if (can(user, "AUDIT_LOG")) allowed.push("audit");
  if (can(user, "SETTINGS")) allowed.push("settings");

  return (
    <AdminShell allowed={allowed} user={{ fullName: user.fullName, email: user.email, role: user.role }} signOutAction={signOut}>
      {children}
    </AdminShell>
  );
}
