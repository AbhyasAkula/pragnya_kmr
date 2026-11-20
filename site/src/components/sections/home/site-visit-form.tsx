"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  CheckCircle2,
  House,
  Info,
  Loader2,
  MessageSquareText,
  Phone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { duration, easeLuxe } from "@/config/motion";
import { siteConfig } from "@/config/site";
import { emailHref, phoneHref, whatsappHref } from "@/lib/contact";
import { addDays, todayInTimeZone } from "@/lib/dates";
import { newIdempotencyKey, submitSiteVisit } from "@/lib/site-visit-submit";
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

/** Contact-page inputs: squarer corners and room for a leading icon. */
const contactInputClass =
  "block min-h-[3.25rem] w-full rounded-xl border border-field/80 bg-white py-3 pr-4 pl-11 text-[0.95rem] text-ink shadow-[inset_0_1px_2px_rgba(28,25,23,0.04)] transition-[border-color,box-shadow] duration-300 placeholder:text-placeholder hover:border-stone focus:border-gold focus:ring-4 focus:ring-gold-light/25 focus:outline-none aria-invalid:border-danger";

/**
 * Native date input, restyled: the (invisible) browser picker button covers
 * the whole field, so a click or tap anywhere opens the calendar.
 */
const datePickerClass =
  "relative cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

const chevron = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2357534e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
};

type Appearance = "default" | "contact";

type SiteVisitFormProps = {
  villaOptions: string[];
  /** Pre-selects a villa (e.g. on that villa's detail page). Must be one of `villaOptions`. */
  defaultVilla?: string;
  /**
   * "default": homepage / villa pages. "contact": the Contact page design
   * (title-case labels with icons, leading input icons, pine submit button).
   * Same fields, validation, demo handling and accessibility either way.
   */
  appearance?: Appearance;
  /** Contact design: villa name → short description (e.g. "3 BHK Villa") for the option cards. */
  villaDetails?: Record<string, string>;
};

/** Remounting via `key` gives a clean form (and fresh action state) for a new request. */
export function SiteVisitForm(props: SiteVisitFormProps) {
  const [round, setRound] = useState(0);
  return <EnquiryForm key={round} {...props} onReset={() => setRound((r) => r + 1)} />;
}

function EnquiryForm({
  villaOptions,
  defaultVilla,
  appearance = "default",
  villaDetails = {},
  onReset,
}: SiteVisitFormProps & { onReset: () => void }) {
  const contact = appearance === "contact";
  const field = (icon: LucideIcon) => (contact ? { appearance, icon } : { appearance });
  const control = contact ? contactInputClass : inputClass;
  // One key per form instance, created on first submit (never during
  // prerender): a retried or double-sent submission maps to the same booking.
  // "Start a new request" remounts the form, which starts a fresh key.
  const idempotencyKey = useRef<string | null>(null);
  const [state, formAction, pending] = useActionState((_prev: SiteVisitState, formData: FormData) => {
    idempotencyKey.current ??= newIdempotencyKey();
    return submitSiteVisit(formData, { idempotencyKey: idempotencyKey.current, villaOptions });
  }, initialState);
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
    if (el instanceof RadioNodeList) (el[0] as HTMLElement | undefined)?.focus();
    else if (el instanceof HTMLElement) el.focus();
  }, [state]);

  if (state.status === "success") {
    return <SuccessPanel message={state.message} onReset={onReset} />;
  }

  const describedBy = (field: SiteVisitField) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-5 sm:grid-cols-2">
      {isDemo && !contact ? (
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

      <Field id="name" label={contact ? "Full Name" : "Full name"} required error={errors.name} className="sm:col-span-2" {...field(UserRound)}>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={siteVisitLimits.name}
          defaultValue={values.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("name")}
          className={control}
          placeholder={contact ? "Enter your name" : "Your name"}
        />
      </Field>

      <Field id="phone" label={contact ? "Phone Number" : "Phone"} required error={errors.phone} {...field(Phone)}>
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
          className={control}
          placeholder={contact ? "Enter 10-digit number" : "+91 98765 43210"}
        />
      </Field>

      <Field id="date" label={contact ? "Preferred Date" : "Preferred date"} required error={errors.date} {...field(CalendarDays)}>
        <input
          ref={dateRef}
          id="date"
          name="date"
          type="date"
          required
          defaultValue={values.date}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={describedBy("date")}
          className={cn(control, contact && datePickerClass)}
        />
        {contact ? (
          <CalendarDays className="pointer-events-none absolute top-1/2 right-4 z-10 size-4 -translate-y-1/2 text-gold" strokeWidth={1.75} aria-hidden />
        ) : null}
      </Field>

      {contact ? (
        <VillaChoice
          options={villaOptions}
          details={villaDetails}
          defaultValue={values.villa ?? defaultVilla ?? ""}
          error={errors.villa}
        />
      ) : (
        <Field id="villa" label="Villa of interest" optional error={errors.villa} className="sm:col-span-2">
          <select
            id="villa"
            name="villa"
            defaultValue={values.villa ?? defaultVilla ?? ""}
            aria-invalid={Boolean(errors.villa)}
            aria-describedby={describedBy("villa")}
            className={cn(control, "appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10")}
            style={chevron}
          >
            <option value="">Not sure yet</option>
            {villaOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field id="message" label="Message" optional error={errors.message} className="sm:col-span-2" {...field(MessageSquareText)} noInputIcon>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={siteVisitLimits.message}
          defaultValue={values.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message")}
          className={cn(control, "min-h-28 resize-y", contact && "pl-4")}
          placeholder={contact ? "Let us know your preferred time or any specific request" : "Anything we should know before your visit?"}
        />
      </Field>

      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <ConsentField checked={values.consent === "on"} error={errors.consent} />

      <div className="sm:col-span-2">
        <AnimatePresence>
          {state.status === "error" && state.message ? (
            <motion.div
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <p className="text-sm font-medium text-danger">{state.message}</p>
              {state.fallback ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href={phoneHref}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-field bg-white px-4 text-sm font-semibold text-ink hover:border-stone"
                  >
                    <Phone className="size-4 text-gold" aria-hidden />
                    Call {siteConfig.contact.phone}
                  </a>
                  <a
                    href={whatsappHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-field bg-white px-4 text-sm font-semibold text-ink hover:border-stone"
                  >
                    <WhatsAppIcon className="size-4 text-whatsapp" />
                    WhatsApp us
                  </a>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <Button
          type="submit"
          variant="dark"
          size="lg"
          disabled={pending}
          aria-describedby={isDemo ? "demo-notice" : undefined}
          className={cn(
            "w-full",
            contact &&
              "min-h-[3.75rem] rounded-xl border border-gold-light/70 bg-ink text-base font-semibold tracking-[0.04em] text-white normal-case shadow-[0_18px_36px_-16px_rgba(28,25,23,0.75)] ring-1 ring-gold-light/20 ring-offset-2 ring-offset-white hover:border-gold-light hover:bg-ink-soft hover:shadow-[0_22px_44px_-18px_rgba(28,25,23,0.85)]",
          )}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending request…
            </>
          ) : contact ? (
            <>
              <CalendarDays className="size-5 text-gold-light" strokeWidth={1.5} aria-hidden />
              Book a Site Visit
            </>
          ) : isDemo ? (
            "Try the demo form"
          ) : (
            "Schedule my visit"
          )}
        </Button>
        {isDemo && contact ? (
          // Contact design: the demo notice sits right under the button, before anyone submits.
          <p id="demo-notice" className="mt-4 flex items-start gap-2 text-sm text-stone">
            <Info className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <span>
              <strong className="font-semibold text-ink">Demo mode:</strong> requests are not stored or sent yet. To book
              now, call{" "}
              <a href={siteConfig.contact.phoneHref} className="font-semibold whitespace-nowrap text-ink underline underline-offset-2">
                {siteConfig.contact.phone}
              </a>
              .
            </span>
          </p>
        ) : null}
        <p className={cn("text-xs text-stone", contact ? "mt-2 pl-6" : "mt-4 text-center")}>
          To access, correct or delete your details, email{" "}
          <a href={emailHref} className="underline underline-offset-2 hover:text-ink">
            {siteConfig.contact.email}
          </a>
          .
          {siteConfig.privacy.policyUrl ? (
            <>
              {" "}
              <a href={siteConfig.privacy.policyUrl} className="underline underline-offset-2 hover:text-ink">
                Privacy policy
              </a>
              .
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}

/**
 * Consent to be contacted (required). The wording is versioned: bump
 * `siteConfig.privacy.consentVersion` whenever it changes.
 */
function ConsentField({ checked, error }: { checked: boolean; error?: string }) {
  return (
    <div className="sm:col-span-2">
      <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-stone">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          value="on"
          required
          defaultChecked={checked}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "consent-error" : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-gold"
        />
        <span>
          I agree to {siteConfig.developer} using my name, phone number and visit details to contact me about this site visit
          to {siteConfig.name}.
          <span aria-hidden className="text-danger">
            {" "}
            *
          </span>
        </span>
      </label>
      {error ? (
        <p id="consent-error" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SuccessPanel({ message, onReset }: { message?: string; onReset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Move focus to the result so screen-reader and keyboard users land on it.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easeLuxe }}
      className="flex flex-col items-center py-12 text-center"
    >
      <CheckCircle2 className="size-14 text-success" strokeWidth={1.25} aria-hidden />
      <h3 ref={headingRef} tabIndex={-1} className="mt-6 text-3xl text-ink focus:outline-none">
        Your visit is requested
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
  /** Shows a red asterisk in the contact design (the input itself carries `required`). */
  required?: boolean;
  appearance?: Appearance;
  /** Contact design: small gold icon before the label and inside the input. */
  icon?: LucideIcon;
  /** Contact design: keep the label icon but not the in-field icon (e.g. textarea). */
  noInputIcon?: boolean;
  className?: string;
  children: ReactNode;
};

function Field({
  id,
  label,
  error,
  optional,
  required,
  appearance = "default",
  icon: Icon,
  noInputIcon,
  className,
  children,
}: FieldProps) {
  const errorText = error ? (
    <p id={`${id}-error`} className="mt-2 text-sm text-danger">
      {error}
    </p>
  ) : null;

  if (appearance === "contact") {
    return (
      <div className={className}>
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          {Icon ? <Icon className="size-3.5 text-gold" strokeWidth={2} aria-hidden /> : null}
          {label}
          {required ? (
            <span aria-hidden className="text-danger">
              *
            </span>
          ) : null}
          {optional ? <span className="font-normal text-stone">(Optional)</span> : null}
        </label>
        <div className="relative mt-2">
          {Icon && !noInputIcon ? (
            <Icon
              className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-stone"
              strokeWidth={1.5}
              aria-hidden
            />
          ) : null}
          {children}
        </div>
        {errorText}
      </div>
    );
  }

  return (
    <div className={className}>
      <label htmlFor={id} className="text-xs font-semibold tracking-[0.14em] text-ink uppercase">
        {label}
        {optional ? <span className="ml-2 font-normal tracking-normal text-stone normal-case">(optional)</span> : null}
      </label>
      {children}
      {errorText}
    </div>
  );
}

/**
 * Contact design: villa interest as large, tappable option cards (radio group).
 * Same field name/value as the default <select>, so validation is unchanged.
 */
function VillaChoice({
  options,
  details,
  defaultValue,
  error,
}: {
  options: string[];
  details: Record<string, string>;
  defaultValue: string;
  error?: string;
}) {
  const choices = [...options.map((name) => ({ value: name, label: name, hint: details[name] })), { value: "", label: "Not sure yet", hint: "Help me choose" }];
  return (
    <fieldset className="sm:col-span-2" aria-describedby={error ? "villa-error" : undefined}>
      <legend className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <House className="size-3.5 text-gold" strokeWidth={2} aria-hidden />
        Villa Interest
        <span className="font-normal text-stone">(Optional)</span>
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {choices.map((c) => (
          <label
            key={c.value || "none"}
            className="group relative flex min-h-[4.25rem] cursor-pointer flex-col justify-center rounded-xl border border-field/80 bg-white px-4 py-3 transition-[border-color,background-color,box-shadow] duration-300 hover:border-stone has-[:checked]:border-gold has-[:checked]:bg-gold-light/10 has-[:checked]:shadow-[0_0_0_1px_var(--color-gold)] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gold-light/30"
          >
            <input
              type="radio"
              name="villa"
              value={c.value}
              defaultChecked={defaultValue === c.value}
              className="peer sr-only"
            />
            <span className="pr-5 text-sm font-semibold text-ink">{c.label}</span>
            {c.hint ? <span className="mt-0.5 text-xs text-stone">{c.hint}</span> : null}
            <span
              aria-hidden
              className="absolute top-3 right-3 inline-flex size-4 items-center justify-center rounded-full border border-field bg-white peer-checked:border-gold peer-checked:bg-gold"
            >
              <span className="size-1.5 rounded-full bg-white" />
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id="villa-error" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
