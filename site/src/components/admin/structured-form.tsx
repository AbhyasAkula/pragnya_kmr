"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/admin/action-result";
import { cn } from "@/lib/utils";
import { FormMessage } from "./forms";
import { ImageInput } from "./media-input";
import { btn, FieldError, Hint, inputClass, Label } from "./ui";

/* ---------------------------------------------------------------------------
 * Declarative field specs. Each editor (villa, content section, construction
 * update…) is described as data and rendered by <StructuredForm>. The value
 * is submitted as JSON and re-validated on the server with Zod; server field
 * errors come back keyed by path (e.g. "gallery.2.caption").
 * ------------------------------------------------------------------------- */

type Base = { name: string; label: string; hint?: ReactNode; optional?: boolean; width?: "full" | "half" | "third" };
export type FieldSpec =
  | (Base & { kind: "text"; placeholder?: string; maxLength?: number; inputMode?: "text" | "tel" | "email" | "url" })
  | (Base & { kind: "textarea"; rows?: number; maxLength?: number; placeholder?: string })
  | (Base & { kind: "number"; min?: number; max?: number; suffix?: string })
  | (Base & { kind: "select"; options: { value: string; label: string }[] })
  | (Base & { kind: "checkbox" })
  | (Base & { kind: "date" })
  | (Base & { kind: "image"; allowEmpty?: boolean })
  | (Base & { kind: "stringList"; itemLabel: string; multiline?: boolean; max?: number; maxLength?: number })
  | (Base & {
      kind: "list";
      itemLabel: string;
      fields: FieldSpec[];
      max?: number;
      /** Field whose value titles each item card. */
      titleField?: string;
      newItem?: () => Record<string, unknown>;
      fixedLength?: boolean;
    })
  | (Base & { kind: "group"; fields: FieldSpec[] });

export type FormSection = { title: string; description?: ReactNode; fields: FieldSpec[] };

type Value = Record<string, unknown>;
type Path = (string | number)[];

function getAt(obj: unknown, path: Path): unknown {
  return path.reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string | number, unknown>)[k]), obj);
}
function setAt<T>(obj: T, path: Path, val: unknown): T {
  if (path.length === 0) return val as T;
  const [k, ...rest] = path;
  const src = (obj ?? (typeof k === "number" ? [] : {})) as Record<string | number, unknown>;
  const copy = (Array.isArray(src) ? [...src] : { ...src }) as Record<string | number, unknown>;
  copy[k] = setAt(src[k], rest, val);
  return copy as T;
}
const pathKey = (p: Path) => p.join(".");
const newId = () => Math.random().toString(36).slice(2, 10);

export function StructuredForm({
  action,
  sections,
  initial,
  hidden,
  submitLabel = "Save changes",
  footer,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  sections: FormSection[];
  initial: Value;
  hidden?: Record<string, string>;
  submitLabel?: string;
  footer?: ReactNode;
}) {
  const [value, setValue] = useState<Value>(initial);
  const [dirty, setDirty] = useState(false);
  const [state, formAction, pending] = useActionState(action, null);
  const [, startTransition] = useTransition();
  const errors = state?.errors ?? {};
  const update = (path: Path, v: unknown) => {
    setValue((cur) => setAt(cur, path, v));
    setDirty(true);
  };

  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setDirty(false);
  }

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // After a failed save, move focus to the message so it is announced and visible.
  const messageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state && !state.ok) messageRef.current?.focus();
  }, [state]);

  const errorCount = Object.keys(errors).length;

  return (
    // Submitted via onSubmit (not `action`) so React doesn't auto-reset the
    // form afterwards: the fields must keep showing exactly what was saved.
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {sections.map((s) => (
        <section key={s.title} className="rounded-xl border border-line bg-panel shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-sans text-base font-semibold text-ink">{s.title}</h2>
            {s.description ? <p className="mt-0.5 text-sm text-stone">{s.description}</p> : null}
          </div>
          <div className="grid grid-cols-6 gap-x-4 gap-y-5 p-5">
            {s.fields.map((f) => (
              <Field key={f.name} spec={f} path={[f.name]} value={value} update={update} errors={errors} />
            ))}
          </div>
        </section>
      ))}

      <div
        className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        aria-live="polite"
      >
        <div ref={messageRef} tabIndex={-1} className="focus:outline-none">
          {state ? (
            <FormMessage
              state={
                state.ok
                  ? state
                  : { ...state, message: `${state.message}${errorCount > 1 ? ` (${errorCount} fields need attention)` : ""}` }
              }
              className="mt-0 mb-3"
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone">{dirty ? "You have unsaved changes." : "All changes saved."}</p>
          <div className="flex flex-wrap gap-2">
            {footer}
            <button type="submit" disabled={pending} aria-disabled={pending} className={btn()}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? "Saving…" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

// min-w-0: fieldsets default to min-width: min-content and would otherwise overflow on phones.
const widthClass = { full: "col-span-6 min-w-0", half: "col-span-6 min-w-0 sm:col-span-3", third: "col-span-6 min-w-0 sm:col-span-2" };

function Field({
  spec,
  path,
  value,
  update,
  errors,
}: {
  spec: FieldSpec;
  path: Path;
  value: Value;
  update: (path: Path, v: unknown) => void;
  errors: Record<string, string>;
}) {
  const id = useId();
  const current = getAt(value, path);
  const error = errors[pathKey(path)];
  const describedBy = cn(error ? `${id}-err` : null, spec.hint ? `${id}-hint` : null) || undefined;
  const wrap = (control: ReactNode, label = true) => (
    <div className={widthClass[spec.width ?? "full"]}>
      {label ? (
        <Label htmlFor={id} optional={spec.optional}>
          {spec.label}
        </Label>
      ) : null}
      {control}
      {spec.hint ? <Hint id={`${id}-hint`}>{spec.hint}</Hint> : null}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );

  switch (spec.kind) {
    case "text":
      return wrap(
        <input
          id={id}
          value={(current as string) ?? ""}
          onChange={(e) => update(path, e.target.value)}
          maxLength={spec.maxLength}
          placeholder={spec.placeholder}
          inputMode={spec.inputMode}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={inputClass}
        />,
      );
    case "textarea":
      return wrap(
        <textarea
          id={id}
          value={(current as string) ?? ""}
          onChange={(e) => update(path, e.target.value)}
          rows={spec.rows ?? 3}
          maxLength={spec.maxLength}
          placeholder={spec.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(inputClass, "resize-y")}
        />,
      );
    case "number":
      return wrap(
        <div className="relative">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            value={current === undefined || current === null || Number.isNaN(current) ? "" : String(current)}
            onChange={(e) => update(path, e.target.value === "" ? null : Number(e.target.value))}
            min={spec.min}
            max={spec.max}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(inputClass, spec.suffix && "pr-16")}
          />
          {spec.suffix ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone">{spec.suffix}</span>
          ) : null}
        </div>,
      );
    case "date":
      return wrap(
        <input
          id={id}
          type="date"
          value={(current as string) ?? ""}
          onChange={(e) => update(path, e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={inputClass}
        />,
      );
    case "select":
      return wrap(
        <select
          id={id}
          value={(current as string) ?? ""}
          onChange={(e) => update(path, e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={inputClass}
        >
          {spec.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>,
      );
    case "checkbox":
      return (
        <div className={cn(widthClass[spec.width ?? "full"], "flex items-start gap-3")}>
          <input
            id={id}
            type="checkbox"
            checked={Boolean(current)}
            onChange={(e) => update(path, e.target.checked)}
            aria-describedby={describedBy}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-pine"
          />
          <div>
            <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-ink">
              {spec.label}
            </label>
            {spec.hint ? <Hint id={`${id}-hint`}>{spec.hint}</Hint> : null}
            <FieldError id={`${id}-err`} message={error} />
          </div>
        </div>
      );
    case "image":
      return (
        <div className={widthClass[spec.width ?? "full"]}>
          <ImageInput
            label={spec.label}
            optional={spec.optional}
            value={current as { src: string; alt: string } | undefined}
            onChange={(v) => update(path, v)}
            allowEmpty={spec.allowEmpty}
            errors={{ src: errors[pathKey([...path, "src"])] ?? error, alt: errors[pathKey([...path, "alt"])] }}
            hint={spec.hint}
          />
        </div>
      );
    case "group":
      return (
        <fieldset className={cn(widthClass[spec.width ?? "full"], "grid grid-cols-6 gap-x-4 gap-y-5")}>
          <legend className="col-span-6 mb-1 text-sm font-semibold text-ink">{spec.label}</legend>
          {spec.fields.map((f) => (
            <Field key={f.name} spec={f} path={[...path, f.name]} value={value} update={update} errors={errors} />
          ))}
        </fieldset>
      );
    case "stringList":
      return (
        <StringList spec={spec} path={path} items={(current as string[]) ?? []} update={update} errors={errors} />
      );
    case "list":
      return <ObjectList spec={spec} path={path} items={(current as Value[]) ?? []} value={value} update={update} errors={errors} />;
  }
}

function MoveButtons({ index, length, onMove, label }: { index: number; length: number; onMove: (to: number) => void; label: string }) {
  return (
    <>
      <button type="button" className={btn({ variant: "ghost", size: "sm", className: "px-2" })} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} up`}>
        <ArrowUp className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className={btn({ variant: "ghost", size: "sm", className: "px-2" })}
        disabled={index === length - 1}
        onClick={() => onMove(index + 1)}
        aria-label={`Move ${label} down`}
      >
        <ArrowDown className="size-4" aria-hidden />
      </button>
    </>
  );
}

function move<T>(list: T[], from: number, to: number) {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function StringList({
  spec,
  path,
  items,
  update,
  errors,
}: {
  spec: Extract<FieldSpec, { kind: "stringList" }>;
  path: Path;
  items: string[];
  update: (path: Path, v: unknown) => void;
  errors: Record<string, string>;
}) {
  const id = useId();
  const listError = errors[pathKey(path)];
  return (
    <fieldset className={widthClass[spec.width ?? "full"]} aria-describedby={spec.hint ? `${id}-hint` : undefined}>
      <legend className="mb-1.5 text-sm font-semibold text-ink">
        {spec.label}
        {spec.optional ? <span className="ml-1.5 font-normal text-stone">(optional)</span> : null}
      </legend>
      {spec.hint ? <Hint id={`${id}-hint`}>{spec.hint}</Hint> : null}
      <ol className="mt-2 space-y-2">
        {items.map((item, i) => {
          const itemPath = [...path, i];
          const err = errors[pathKey(itemPath)];
          const label = `${spec.itemLabel} ${i + 1}`;
          return (
            <li key={i} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                {spec.multiline ? (
                  <textarea
                    aria-label={label}
                    value={item}
                    rows={3}
                    maxLength={spec.maxLength}
                    onChange={(e) => update(itemPath, e.target.value)}
                    aria-invalid={Boolean(err)}
                    className={cn(inputClass, "resize-y")}
                  />
                ) : (
                  <input
                    aria-label={label}
                    value={item}
                    maxLength={spec.maxLength}
                    onChange={(e) => update(itemPath, e.target.value)}
                    aria-invalid={Boolean(err)}
                    className={inputClass}
                  />
                )}
                {err ? <p className="mt-1 text-sm text-danger">{err}</p> : null}
              </div>
              <div className="flex shrink-0 items-center">
                <MoveButtons index={i} length={items.length} label={label} onMove={(to) => update(path, move(items, i, to))} />
                <button
                  type="button"
                  className={btn({ variant: "ghost", size: "sm", className: "px-2 text-danger" })}
                  onClick={() => update(path, items.filter((_, j) => j !== i))}
                  aria-label={`Remove ${label}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {listError ? <p className="mt-1.5 text-sm text-danger">{listError}</p> : null}
      {!spec.max || items.length < spec.max ? (
        <button type="button" className={btn({ variant: "secondary", size: "sm", className: "mt-3" })} onClick={() => update(path, [...items, ""])}>
          <Plus className="size-4" aria-hidden /> Add {spec.itemLabel.toLowerCase()}
        </button>
      ) : null}
    </fieldset>
  );
}

function ObjectList({
  spec,
  path,
  items,
  value,
  update,
  errors,
}: {
  spec: Extract<FieldSpec, { kind: "list" }>;
  path: Path;
  items: Value[];
  value: Value;
  update: (path: Path, v: unknown) => void;
  errors: Record<string, string>;
}) {
  const listError = errors[pathKey(path)];
  return (
    <fieldset className={widthClass[spec.width ?? "full"]}>
      <legend className="mb-1.5 text-sm font-semibold text-ink">
        {spec.label}
        {spec.optional ? <span className="ml-1.5 font-normal text-stone">(optional)</span> : null}
      </legend>
      {spec.hint ? <Hint>{spec.hint}</Hint> : null}
      {items.length === 0 ? <p className="mt-2 text-sm text-stone">None yet.</p> : null}
      <ol className="mt-3 space-y-3">
        {items.map((item, i) => {
          const title = spec.titleField ? String(item[spec.titleField] ?? "").trim() : "";
          const label = `${spec.itemLabel} ${i + 1}`;
          const hasError = Object.keys(errors).some((k) => k.startsWith(pathKey([...path, i]) + "."));
          return (
            <li
              key={(item.id as string) ?? i}
              className={cn("rounded-lg border bg-canvas/50", hasError ? "border-danger/60" : "border-line")}
            >
              <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                <p className="min-w-0 truncate text-sm font-semibold text-ink">
                  {label}
                  {title ? <span className="font-normal text-stone"> · {title}</span> : null}
                </p>
                {spec.fixedLength ? null : (
                  <div className="flex shrink-0 items-center">
                    <MoveButtons index={i} length={items.length} label={label} onMove={(to) => update(path, move(items, i, to))} />
                    <button
                      type="button"
                      className={btn({ variant: "ghost", size: "sm", className: "px-2 text-danger" })}
                      onClick={() => update(path, items.filter((_, j) => j !== i))}
                      aria-label={`Remove ${label}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-6 gap-x-4 gap-y-4 p-3 sm:p-4">
                {spec.fields.map((f) => (
                  <Field key={f.name} spec={f} path={[...path, i, f.name]} value={value} update={update} errors={errors} />
                ))}
              </div>
            </li>
          );
        })}
      </ol>
      {listError ? <p className="mt-1.5 text-sm text-danger">{listError}</p> : null}
      {!spec.fixedLength && (!spec.max || items.length < spec.max) ? (
        <button
          type="button"
          className={btn({ variant: "secondary", size: "sm", className: "mt-3" })}
          onClick={() => update(path, [...items, { id: newId(), ...(spec.newItem?.() ?? {}) }])}
        >
          <Plus className="size-4" aria-hidden /> Add {spec.itemLabel.toLowerCase()}
        </button>
      ) : null}
    </fieldset>
  );
}
