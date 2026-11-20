"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { SiteVisitForm } from "@/components/sections/home/site-visit-form";
import type { SiteContact } from "@/types/content";

type VillaOption = { slug: string; name: string; configuration?: string };
/** Contact details and booking settings forwarded to the form. */
export type FormContext = { contactInfo: SiteContact; bookingsOpen: boolean; privacyPolicyUrl: string | null };

const detailsOf = (villas: VillaOption[]) =>
  Object.fromEntries(villas.flatMap((v) => (v.configuration ? [[v.name, v.configuration]] : [])));

/**
 * The contact page's Book a Site Visit form.
 * - `?villa=<slug>` pre-selects that villa.
 * - `?type=visit` (used by every "Book a Site Visit" button) brings the form
 *   into view and moves focus to its heading, without opening a mobile keyboard.
 * Reads search params, so render it inside <Suspense> with
 * <ContactVisitFormFallback> (the same form, without the pre-selection).
 */
export function ContactVisitForm({
  villas,
  anchorId,
  headingId,
  context,
}: {
  villas: VillaOption[];
  anchorId: string;
  headingId: string;
  context: FormContext;
}) {
  const params = useSearchParams();
  const villa = villas.find((v) => v.slug === params.get("villa"))?.name;
  const arrivingToBook = params.get("type") === "visit";

  useEffect(() => {
    if (!arrivingToBook) return;
    const section = document.getElementById(anchorId);
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = section.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.5 || top < 0) {
      section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    document.getElementById(headingId)?.focus({ preventScroll: true });
  }, [arrivingToBook, anchorId, headingId]);

  return <SiteVisitForm key={villa ?? "none"} appearance="contact" villaOptions={villas.map((v) => v.name)} villaDetails={detailsOf(villas)} defaultVilla={villa} {...context} />;
}

/** Server-rendered stand-in: identical form, so there is no layout shift. */
export function ContactVisitFormFallback({ villas, context }: { villas: VillaOption[]; context: FormContext }) {
  return <SiteVisitForm appearance="contact" villaOptions={villas.map((v) => v.name)} villaDetails={detailsOf(villas)} {...context} />;
}
