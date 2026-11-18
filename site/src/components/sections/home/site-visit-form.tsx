"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { requestSiteVisit } from "@/actions/site-visit";
import { Button } from "@/components/ui/button";
import { duration, easeLuxe } from "@/config/motion";
import { siteConfig } from "@/config/site";
import { addDays, todayInTimeZone } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  siteVisitFields,
  siteVisitLimits,
  type SiteVisitField,
  type SiteVisitState,
} from "@/lib/validation/site-visit";

const initialState: SiteVisitState = { status: "idle" };
const isDemo = !siteConfig.features.leadStorageConnected;

const inputClass =
  "mt-2 block min-h-12 w-full rounded-xl border border-field bg-white px-4 py-3 text-base text-ink transition-[border-color,box-shadow] duration-300 placeholder:text-placeholder focus:border-gold focus:ring-4 focus:ring-gold-light/30 focus:outline-none aria-invalid:border-danger";

type SiteVisitFormProps = {
  villaOptions: string[];
  /** Pre-selects a villa (e.g. on that villa's detail page). Must be one of `villaOptions`. */
  defaultVilla?: string;
};

/** Remounting via `key` gives a clean form (and fresh action state) for a new request. */
export function SiteVisitForm(props: SiteVisitFormProps) {
  const [round, setRound] = useState(0);
  return <EnquiryForm key={round} {...props} onReset={() => setRound((r) => r + 1)} />;
}

function EnquiryForm({ villaOptions, defaultVilla, onReset }: SiteVisitFormProps & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(requestSiteVisit, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  // Date bounds depend on "today", so set them after mount (never during prerender).
  useEffect(() => {
    const input = dateRef.current;
    if (!input) return;
    const today = todayInTimeZone(siteConfig.timeZone);
    input.min = today;
    input.max = addDays(today, siteVisitLimits.maxDaysAhead);
  }, []);

  // After a failed submit, move focus to the first invalid field.
  useEffect(() => {
    if (state.status !== "error" || !state.errors) return;
    const first = siteVisitFields.find((f) => state.errors?.[f]);
    if (!first) return;
    const el = formRef.current?.elements.namedItem(first);
    if (el instanceof HTMLElement) el.focus();
  }, [state]);

  if (state.status === "success") {
    return <SuccessPanel demo={Boolean(state.demo)} message={state.message} onReset={onReset} />;
  }

  const describedBy = (field: SiteVisitField) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-5 sm:grid-cols-2">
      {isDemo ? (
        <p
          id="demo-notice"
          className="flex gap-3 rounded-xl border border-gold/30 bg-gold-light/15 px-4 py-3 text-sm text-ink sm:col-span-2"
        >
          <Info className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          <span>
            <strong className="font-semibold">Demo form.</strong> Submissions are not stored or sent
            yet. To book a visit, call{" "}
            <a href={siteConfig.contact.phoneHref} className="font-semibold underline underline-offset-2">
              {siteConfig.contact.phone}
            </a>
            .
          </span>
        </p>
      ) : null}

      <Field id="name" label="Full name" error={errors.name} className="sm:col-span-2">
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={siteVisitLimits.name}
          defaultValue={values.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("name")}
          className={inputClass}
          placeholder="Your name"
        />
      </Field>

      <Field id="phone" label="Phone" error={errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          maxLength={siteVisitLimits.phone}
          defaultValue={values.phone}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy("phone")}
          className={inputClass}
          placeholder="+91 98765 43210"
        />
      </Field>

      <Field id="email" label="Email" optional error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={siteVisitLimits.email}
          defaultValue={values.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email")}
          className={inputClass}
          placeholder="you@example.com"
        />
      </Field>

      <Field id="date" label="Preferred date" error={errors.date}>
        <input
          ref={dateRef}
          id="date"
          name="date"
          type="date"
          required
          defaultValue={values.date}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={describedBy("date")}
          className={inputClass}
        />
      </Field>

      <Field id="villa" label="Interested in" optional error={errors.villa}>
        <select
          id="villa"
          name="villa"
          defaultValue={values.villa ?? defaultVilla ?? ""}
          aria-invalid={Boolean(errors.villa)}
          aria-describedby={describedBy("villa")}
          className={cn(inputClass, "appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10")}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2357534e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
        >
          <option value="">Not sure yet</option>
          {villaOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>

      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="sm:col-span-2">
        <AnimatePresence>
          {state.status === "error" && state.message ? (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 text-sm font-medium text-danger"
            >
              {state.message}
            </motion.p>
          ) : null}
        </AnimatePresence>
        <Button
          type="submit"
          variant="dark"
          size="lg"
          disabled={pending}
          aria-describedby={isDemo ? "demo-notice" : undefined}
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending request…
            </>
          ) : isDemo ? (
            "Try the demo form"
          ) : (
            "Schedule my visit"
          )}
        </Button>
        <p className="mt-4 text-center text-xs text-stone">
          By submitting, you agree to be contacted about {siteConfig.name}. We never share your details.
        </p>
      </div>
    </form>
  );
}

function SuccessPanel({
  demo,
  message,
  onReset,
}: {
  demo: boolean;
  message?: string;
  onReset: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Move focus to the result so screen-reader and keyboard users land on it.
  useEffect(() => headingRef.current?.focus(), []);

  const Icon = demo ? Info : CheckCircle2;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easeLuxe }}
      className="flex flex-col items-center py-12 text-center"
    >
      <Icon className={cn("size-14", demo ? "text-gold" : "text-success")} strokeWidth={1.25} aria-hidden />
      <h3 ref={headingRef} tabIndex={-1} className="mt-6 text-3xl text-ink focus:outline-none">
        {demo ? "Demo only — nothing was sent" : "Your visit is requested"}
      </h3>
      <p className="mt-3 max-w-sm text-stone">{message}</p>
      <Button variant="outline" className="mt-8" onClick={onReset}>
        Start a new request
      </Button>
    </motion.div>
  );
}

type FieldProps = {
  id: SiteVisitField;
  label: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

function Field({ id, label, error, optional, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-xs font-semibold tracking-[0.14em] text-ink uppercase">
        {label}
        {optional ? <span className="ml-2 font-normal tracking-normal text-stone normal-case">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
