import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton, TextField } from "@/components/admin/forms";
import { Notice } from "@/components/admin/ui";
import { safeAdminPath } from "@/lib/admin/origin";
import { getAdminUser } from "@/lib/admin/session";
import { isAuthConfigured } from "@/lib/supabase/config";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

const messages: Record<string, { tone: "info" | "danger" | "success"; text: string }> = {
  disabled: { tone: "danger", text: "This account has been disabled. Contact the owner if you need access." },
  signed_out: { tone: "success", text: "You've been signed out." },
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  if (await getAdminUser()) redirect(safeAdminPath(params.next));
  const notice = params.error ? messages[String(params.error)] : params.signed_out ? messages.signed_out : null;

  return (
    <>
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-1 text-sm text-stone">Aurelia Enclave dashboard</p>
      {!isAuthConfigured() ? (
        <Notice tone="warning" title="Sign-in isn't configured" className="mt-5">
          Add the Supabase URL and keys to the environment (see README → Admin dashboard setup).
        </Notice>
      ) : null}
      {notice ? (
        <Notice tone={notice.tone} className="mt-5">
          {notice.text}
        </Notice>
      ) : null}
      <ActionForm action={signIn} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={safeAdminPath(params.next)} />
        <TextField name="email" label="Email" type="email" autoComplete="username" required maxLength={254} />
        <TextField name="password" label="Password" type="password" autoComplete="current-password" required maxLength={200} />
        <SubmitButton className="w-full" pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </ActionForm>
      <p className="mt-5 text-center text-sm">
        <Link href="/admin/forgot-password" className="font-medium text-gold underline-offset-2 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </>
  );
}
