"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  createContext,
  use,
  useActionState,
  useEffect,
  useId,
  useRef,
  useTransition,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/admin/action-result";
import { cn } from "@/lib/utils";
import { btn, FieldError, Hint, inputClass, Label } from "./ui";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

const ResultContext = createContext<ActionResult>(null);
export const useActionResult = () => use(ResultContext);
export function useFieldError(name: string) {
  return use(ResultContext)?.errors?.[name];
}

/**
 * A form bound to a Server Action. Shows the server's message after it
 * responds (success only when the action reports a committed change) and
 * exposes field errors to the fields inside it.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  hideMessage = false,
  ...props
}: Omit<ComponentProps<"form">, "action"> & { action: Action; resetOnSuccess?: boolean; hideMessage?: boolean }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <ResultContext value={state}>
      <PendingContext value={pending}>
        {/* onSubmit (not `action`): React would otherwise reset every field after
            each submit, wiping what the user typed when the server reports an error. */}
        <form ref={ref} className={className} onSubmit={submitVia(formAction, startTransition, pending)} {...props}>
          {children}
          {hideMessage && state?.ok !== false ? null : <FormMessage state={state} />}
        </form>
      </PendingContext>
    </ResultContext>
  );
}

/** Pending state of the surrounding ActionForm (null outside one). */
const PendingContext = createContext<boolean | null>(null);

/** Submit handler that keeps field values: sends the form (with the pressed button) to the action. */
export function submitVia(
  formAction: (data: FormData) => void,
  startTransition: (fn: () => void) => void,
  pending: boolean,
) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(data));
  };
}

export function FormMessage({ state, className }: { state: ActionResult; className?: string }) {
  if (!state?.message) return null;
  const Icon = state.ok ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
        state.ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string; variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md" }) {
  const status = useFormStatus();
  const ctxPending = use(PendingContext);
  const pending = ctxPending ?? status.pending;
  return (
    <button type="submit" disabled={pending || props.disabled} aria-disabled={pending} className={btn({ variant, size, className })} {...props}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

type FieldBase = { name: string; label: string; hint?: ReactNode; optional?: boolean; className?: string };

export function TextField({
  name,
  label,
  hint,
  optional,
  className,
  ...input
}: FieldBase & Omit<ComponentProps<"input">, "name">) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={cn(error ? `${id}-err` : null, hint ? `${id}-hint` : null) || undefined}
        className={inputClass}
        {...input}
      />
      {hint ? <Hint id={`${id}-hint`}>{hint}</Hint> : null}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export function TextareaField({ name, label, hint, optional, className, ...input }: FieldBase & Omit<ComponentProps<"textarea">, "name">) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <textarea
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={cn(error ? `${id}-err` : null, hint ? `${id}-hint` : null) || undefined}
        className={cn(inputClass, "min-h-24 resize-y")}
        {...input}
      />
      {hint ? <Hint id={`${id}-hint`}>{hint}</Hint> : null}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  hint,
  optional,
  className,
  options,
  ...select
}: FieldBase & Omit<ComponentProps<"select">, "name"> & { options: { value: string; label: string }[] }) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <select id={id} name={name} aria-invalid={Boolean(error)} className={cn(inputClass, "pr-8")} {...select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <Hint>{hint}</Hint> : null}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export function CheckboxField({ name, label, hint, className, ...input }: Omit<FieldBase, "optional"> & Omit<ComponentProps<"input">, "name" | "type">) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input id={id} name={name} type="checkbox" className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-pine" {...input} />
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-ink">
          {label}
        </label>
        {hint ? <Hint>{hint}</Hint> : null}
      </div>
    </div>
  );
}

/**
 * A button that asks for confirmation in a modal dialog before running a
 * Server Action (deletes, disabling accounts…). Uses the native <dialog>
 * element: focus is trapped and Escape closes it.
 */
export function ConfirmAction({
  action,
  hidden,
  trigger,
  title,
  body,
  confirmLabel,
  variant = "danger",
  triggerVariant = "secondary",
  size = "md",
}: {
  action: Action;
  hidden?: Record<string, string>;
  trigger: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  variant?: "danger" | "primary";
  triggerVariant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(action, null);
  const titleId = useId();
  useEffect(() => {
    if (state?.ok) ref.current?.close();
  }, [state]);
  return (
    <>
      <button type="button" className={btn({ variant: triggerVariant, size })} onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      {state?.ok && state.message ? <FormMessage state={state} className="mt-2" /> : null}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50"
      >
        <form action={formAction} className="p-6">
          {Object.entries(hidden ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2 id={titleId} className="font-sans text-lg font-semibold">
            {title}
          </h2>
          <div className="mt-2 text-sm text-stone">{body}</div>
          {state && !state.ok ? <FormMessage state={state} /> : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={btn({ variant: "secondary" })} onClick={() => ref.current?.close()}>
              Cancel
            </button>
            <SubmitButton variant={variant} pendingLabel="Working…">
              {confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
