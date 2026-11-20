import type { Metadata } from "next";
import { ActionForm, SubmitButton, TextField } from "@/components/admin/forms";
import { Badge, btn, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { PERMISSION_INFO } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { signOut } from "../../(auth)/actions";
import { changeMyPassword, updateMyName } from "./actions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireAdminPage();
  return (
    <>
      <PageHeader title="My account" description={user.email} />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <ActionForm action={updateMyName} className="space-y-4 p-5">
            <TextField name="fullName" label="Display name" defaultValue={user.fullName} required maxLength={80} />
            <div>
              <p className="text-sm font-semibold text-ink">Access</p>
              <p className="mt-1 flex flex-wrap gap-1.5">
                {user.role === "OWNER" ? (
                  <Badge tone="gold">Owner — full access</Badge>
                ) : (
                  user.permissions.map((p) => (
                    <Badge key={p} tone="neutral">
                      {PERMISSION_INFO[p].label}
                    </Badge>
                  ))
                )}
              </p>
            </div>
            <SubmitButton variant="secondary">Save name</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <CardHeader title="Change password" />
          <ActionForm action={changeMyPassword} resetOnSuccess className="space-y-4 p-5">
            <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />
            <TextField name="current" label="Current password" type="password" autoComplete="current-password" required maxLength={200} />
            <TextField name="password" label="New password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} hint="At least 12 characters." />
            <TextField name="confirm" label="Confirm new password" type="password" autoComplete="new-password" required maxLength={72} />
            <SubmitButton>Change password</SubmitButton>
          </ActionForm>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title="Sessions"
            description="Signed in on a shared or lost device? Sign out everywhere — you'll need your password again on every device."
            actions={
              <form action={signOut}>
                <input type="hidden" name="everywhere" value="1" />
                <button type="submit" className={btn({ variant: "secondary" })}>
                  Sign out everywhere
                </button>
              </form>
            }
          />
        </Card>
      </div>
    </>
  );
}
