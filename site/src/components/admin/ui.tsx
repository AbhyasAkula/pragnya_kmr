/**
 * Admin dashboard UI primitives (server-safe). Brand tokens from
 * globals.css, denser and plainer than the marketing site: clear hierarchy,
 * 44px touch targets, visible focus, AA contrast.
 */
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* -------------------------------- buttons -------------------------------- */

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
type BtnSize = "sm" | "md";

export function btn({ variant = "primary", size = "md", className }: { variant?: BtnVariant; size?: BtnSize; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-sans font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-55",
    size === "md" ? "min-h-11 px-4 text-sm" : "min-h-9 px-3 text-[0.8125rem]",
    variant === "primary" && "bg-pine text-ivory hover:bg-pine-soft",
    variant === "secondary" && "border border-field/60 bg-white text-ink hover:border-ink/60 hover:bg-sand/60",
    variant === "danger" && "bg-danger text-white hover:bg-[#931c13]",
    variant === "ghost" && "text-ink hover:bg-sand",
    className,
  );
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: BtnSize }) {
  return <Link className={btn({ variant, size, className })} {...props} />;
}

/* --------------------------------- layout -------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-2 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-stone hover:text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-3xl text-ink sm:text-[2.25rem]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-stone">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-line bg-panel shadow-[0_1px_2px_rgba(28,25,23,0.04)]", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, actions, id }: { title: string; description?: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 id={id} className="font-sans text-base font-semibold text-ink">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-sm text-stone">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/* --------------------------------- badges -------------------------------- */

export type Tone = "neutral" | "info" | "warning" | "success" | "danger" | "gold";

const toneClass: Record<Tone, string> = {
  neutral: "bg-sand text-stone",
  info: "bg-info-bg text-info",
  warning: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  gold: "bg-gold-light/25 text-gold",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- notices -------------------------------- */

export function Notice({ tone = "info", title, children, className }: { tone?: Tone; title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg px-4 py-3 text-sm", toneClass[tone], className)} role={tone === "danger" ? "alert" : undefined}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={cn(title && "mt-0.5")}>{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-stone/70">{icon}</div> : null}
      <p className="font-semibold text-ink">{title}</p>
      {children ? <p className="mt-1 max-w-md text-sm text-stone">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AccessDenied({ feature }: { feature: string }) {
  return (
    <Card className="mx-auto mt-6 max-w-xl">
      <EmptyState icon={<Lock className="size-8" aria-hidden />} title={`You don't have access to ${feature}`} action={<LinkButton href="/admin" variant="secondary">Back to dashboard</LinkButton>}>
        Ask the owner to grant this permission on the Staff page.
      </EmptyState>
    </Card>
  );
}

/* --------------------------------- fields -------------------------------- */

export const inputClass =
  "block min-h-11 w-full rounded-lg border border-field/70 bg-white px-3 py-2 text-[0.9375rem] text-ink shadow-[inset_0_1px_1px_rgba(28,25,23,0.04)] placeholder:text-placeholder focus:border-gold focus:ring-3 focus:ring-gold-light/30 focus:outline-none aria-invalid:border-danger disabled:bg-sand/50";

export function Label({ htmlFor, children, optional, className }: { htmlFor?: string; children: ReactNode; optional?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-semibold text-ink", className)}>
      {children}
      {optional ? <span className="ml-1.5 font-normal text-stone">(optional)</span> : null}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {message}
    </p>
  );
}

export function Hint({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="mt-1.5 text-xs text-stone">
      {children}
    </p>
  );
}

/* ------------------------------ data display ----------------------------- */

export function Stat({ label, value, hint, href, tone }: { label: string; value: ReactNode; hint?: ReactNode; href?: string; tone?: Tone }) {
  const body = (
    <>
      <p className="text-sm font-medium text-stone">{label}</p>
      <p className={cn("mt-1 font-sans text-3xl font-semibold tabular-nums", tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-ink")}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
    </>
  );
  const cls = "block rounded-xl border border-line bg-panel p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-gold/50")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Pagination({ page, pageCount, hrefFor, total, label = "results" }: { page: number; pageCount: number; hrefFor: (page: number) => string; total: number; label?: string }) {
  if (total === 0) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-stone">
      <p>
        Page <span className="font-semibold text-ink">{page}</span> of {pageCount} · {total} {label}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <LinkButton href={hrefFor(page - 1)} variant="secondary" size="sm" aria-label="Previous page">
            <ChevronLeft className="size-4" aria-hidden /> Prev
          </LinkButton>
        ) : null}
        {page < pageCount ? (
          <LinkButton href={hrefFor(page + 1)} variant="secondary" size="sm" aria-label="Next page">
            Next <ChevronRight className="size-4" aria-hidden />
          </LinkButton>
        ) : null}
      </div>
    </nav>
  );
}

export function DescriptionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-xs font-semibold tracking-wide text-stone uppercase">{i.label}</dt>
          <dd className="mt-1 text-[0.9375rem] break-words text-ink">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
