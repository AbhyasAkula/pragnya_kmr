import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { Notice } from "@/components/admin/ui";
import { confirmAuthLink } from "../../actions";

export const metadata: Metadata = { title: "Continue" };

/**
 * Landing page for invitation and password-reset links. The token is only
 * used when the person presses Continue (a POST), so automated link
 * scanners in email clients can't use it up.
 */
export default async function ConfirmPage({ searchParams }: PageProps<"/admin/auth/confirm">) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  const type = typeof params.type === "string" ? params.type : "";
  const code = typeof params.code === "string" ? params.code : "";
  const valid = (tokenHash && (type === "invite" || type === "recovery")) || code;
  const invite = type === "invite";

  return (
    <>
      <h1 className="font-display text-3xl">{invite ? "Welcome to the team" : "Reset your password"}</h1>
      {valid ? (
        <>
          <p className="mt-2 text-sm text-stone">
            {invite
              ? "You've been invited to the Aurelia Enclave dashboard. Continue to choose your password."
              : "Continue to choose a new password for your account."}
          </p>
          <ActionForm action={confirmAuthLink} className="mt-6">
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="code" value={code} />
            <SubmitButton className="w-full" pendingLabel="Checking link…">
              Continue
            </SubmitButton>
          </ActionForm>
        </>
      ) : (
        <Notice tone="danger" className="mt-5">
          This link is incomplete or invalid. Ask the owner for a new link.
        </Notice>
      )}
      <p className="mt-5 text-center text-sm">
        <Link href="/admin/login" className="font-medium text-gold underline-offset-2 hover:underline">
          Go to sign in
        </Link>
      </p>
    </>
  );
}
