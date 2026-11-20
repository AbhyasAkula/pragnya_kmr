"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { ActionResult } from "@/lib/admin/action-result";
import { PERMISSIONS, PERMISSION_INFO, type Permission } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { ActionForm, FormMessage, SubmitButton, useActionResult } from "./forms";
import { btn, FieldError, Hint, inputClass, Label } from "./ui";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/** Shows a one-time link with a copy button. */
export function SecretLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 rounded-lg border border-gold/40 bg-gold-light/10 p-4">
      <Label htmlFor="secret-link">One-time link</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="secret-link" readOnly value={link} onFocus={(e) => e.target.select()} className={cn(inputClass, "font-mono text-xs")} />
        <button
          type="button"
          className={btn({ variant: "secondary" })}
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          }}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <Hint>
        Send it by WhatsApp or email to that person only. It works once and expires after the time set in Supabase (1 hour by
        default). It isn&apos;t stored here — create a new one if needed.
      </Hint>
    </div>
  );
}

export function StaffForm({
  action,
  mode,
  initial,
  hidden,
  lockRole,
}: {
  action: Action;
  mode: "invite" | "edit";
  initial: { fullName: string; email: string; role: "OWNER" | "STAFF"; permissions: Permission[] };
  hidden?: Record<string, string>;
  lockRole?: boolean;
}) {
  return (
    <ActionForm action={action} className="space-y-6 p-5" hideMessage>
      <StaffFields mode={mode} initial={initial} hidden={hidden} lockRole={lockRole} />
    </ActionForm>
  );
}

function StaffFields({
  mode,
  initial,
  hidden,
  lockRole,
}: {
  mode: "invite" | "edit";
  initial: { fullName: string; email: string; role: "OWNER" | "STAFF"; permissions: Permission[] };
  hidden?: Record<string, string>;
  lockRole?: boolean;
}) {
  const state = useActionResult();
  const [role, setRole] = useState(initial.role);
  const errors = state?.errors ?? {};

  return (
    <>
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <input id="fullName" name="fullName" defaultValue={initial.fullName} required maxLength={80} autoComplete="off" aria-invalid={Boolean(errors.fullName)} className={inputClass} />
          <FieldError id="fullName-err" message={errors.fullName} />
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={initial.email}
            required
            maxLength={254}
            readOnly={mode === "edit"}
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
            className={cn(inputClass, mode === "edit" && "bg-sand/50 text-stone")}
          />
          {mode === "edit" ? <Hint>Email can&apos;t be changed. Invite a new account instead.</Hint> : null}
          <FieldError id="email-err" message={errors.email} />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Role</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["STAFF", "OWNER"] as const).map((r) => (
            <label
              key={r}
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border p-4",
                role === r ? "border-pine bg-pine/5" : "border-line",
                lockRole && role !== r && "cursor-not-allowed opacity-50",
              )}
            >
              <input type="radio" name="role" value={r} checked={role === r} disabled={lockRole && role !== r} onChange={() => setRole(r)} className="mt-1 size-4 accent-pine" />
              <span>
                <span className="block font-semibold text-ink">{r === "OWNER" ? "Owner" : "Staff"}</span>
                <span className="block text-sm text-stone">
                  {r === "OWNER" ? "Full access, including staff accounts and permissions." : "Only the areas you choose below."}
                </span>
              </span>
            </label>
          ))}
        </div>
        {lockRole ? <Hint>You can&apos;t change your own role.</Hint> : null}
        {lockRole ? <input type="hidden" name="role" value={role} /> : null}
      </fieldset>

      {role === "STAFF" ? (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Access</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((p) => (
              <label key={p} className="flex cursor-pointer gap-3 rounded-lg border border-line p-3 hover:border-ink/30">
                <input type="checkbox" name="permissions" value={p} defaultChecked={initial.permissions.includes(p)} className="mt-0.5 size-5 shrink-0 accent-pine" />
                <span>
                  <span className="block text-sm font-semibold text-ink">{PERMISSION_INFO[p].label}</span>
                  <span className="block text-xs text-stone">{PERMISSION_INFO[p].description}</span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id="permissions-err" message={errors.permissions} />
          <Hint>Staff can never manage other staff accounts.</Hint>
        </fieldset>
      ) : null}

      {state?.ok ? <FormMessage state={state} /> : null}
      {state?.ok && state.secret ? <SecretLink link={state.secret} /> : null}
      {mode === "invite" && state?.ok ? null : (
        <SubmitButton pendingLabel={mode === "invite" ? "Creating invitation…" : "Saving…"}>{mode === "invite" ? "Create invitation" : "Save changes"}</SubmitButton>
      )}
    </>
  );
}

/** A button that generates a one-time link and shows it. */
export function AccessLinkButton({ action, id, label }: { action: Action; id: string; label: string }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="secondary" pendingLabel="Creating link…">
        {label}
      </SubmitButton>
      <SecretFromResult />
    </ActionForm>
  );
}

function SecretFromResult() {
  const state = useActionResult();
  return state?.ok && state.secret ? <SecretLink link={state.secret} /> : null;
}
