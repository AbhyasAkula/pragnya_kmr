import { twMerge } from "tailwind-merge";

/**
 * Joins class names and resolves Tailwind conflicts so a later class wins
 * (e.g. a `className="hidden"` override beats a component's base `inline-flex`).
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}

/** Formats INR as "₹3.4 Cr" / "₹85 L" — the convention for Indian real estate. */
export function formatPriceINR(amount: number) {
  if (amount >= 1_00_00_000) {
    const crore = amount / 1_00_00_000;
    return `₹${Number.isInteger(crore) ? crore : crore.toFixed(1)} Cr`;
  }
  const lakh = amount / 1_00_000;
  return `₹${Math.round(lakh)} L`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}
