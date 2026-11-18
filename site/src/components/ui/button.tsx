import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "dark" | "outline" | "outline-light" | "ghost-light";
type Size = "md" | "lg";

const base =
  "group inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full font-sans text-[0.8125rem] font-semibold uppercase tracking-[0.16em] transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-luxe focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  gold: "bg-gold-light text-ink shadow-[0_10px_30px_-12px_rgba(212,175,106,0.7)] hover:bg-gold-pale",
  dark: "bg-ink text-ivory hover:bg-ink-soft",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-ivory",
  "outline-light": "border border-white/40 text-white backdrop-blur-sm hover:border-white hover:bg-white hover:text-ink",
  "ghost-light": "text-white hover:text-gold-light",
};

const sizes: Record<Size, string> = {
  md: "px-6 py-3",
  lg: "px-8 py-4",
};

type StyleProps = { variant?: Variant; size?: Size; className?: string };

export function buttonClasses({ variant = "gold", size = "md", className }: StyleProps = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: StyleProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: StyleProps & ComponentProps<"button">) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
