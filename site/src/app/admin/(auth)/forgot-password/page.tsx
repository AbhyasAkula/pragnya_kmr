import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton, TextField } from "@/components/admin/forms";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-3xl">Reset your password</h1>
      <p className="mt-1 text-sm text-stone">
        Enter your work email. If it belongs to an active staff account, we&apos;ll email you a reset link. You can also ask
        the owner to create a reset link for you.
      </p>
      <ActionForm action={requestPasswordReset} className="mt-6 space-y-4">
        <TextField name="email" label="Email" type="email" autoComplete="username" required maxLength={254} />
        <SubmitButton className="w-full" pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </ActionForm>
      <p className="mt-5 text-center text-sm">
        <Link href="/admin/login" className="font-medium text-gold underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
