import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton, TextField } from "@/components/admin/forms";
import { getStaffForSession } from "@/lib/admin/session";
import { setPassword } from "../actions";

export const metadata: Metadata = { title: "Choose a password" };

export default async function SetPasswordPage() {
  const staff = await getStaffForSession();
  if (!staff || staff.status === "DISABLED") redirect("/admin/login");

  return (
    <>
      <h1 className="font-display text-3xl">Choose a password</h1>
      <p className="mt-1 text-sm text-stone">
        Signed in as <span className="font-semibold text-ink">{staff.email}</span>. Use at least 12 characters — a short
        sentence is easy to remember and hard to guess.
      </p>
      <ActionForm action={setPassword} className="mt-6 space-y-4">
        <input type="email" name="username" autoComplete="username" value={staff.email} readOnly hidden />
        <TextField name="password" label="New password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} />
        <TextField name="confirm" label="Confirm new password" type="password" autoComplete="new-password" required maxLength={72} />
        <SubmitButton className="w-full" pendingLabel="Saving…">
          Save password and continue
        </SubmitButton>
      </ActionForm>
    </>
  );
}
