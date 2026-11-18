import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { primaryCta } from "@/config/navigation";
import type { Link, SectionCopy } from "@/types/content";

type CtaBandProps = SectionCopy & {
  /** Secondary action shown beside the site-visit button. */
  secondary?: Link;
  id?: string;
};

/** Closing call-to-action used at the foot of interior pages. */
export function CtaBand({ secondary, id = "page-cta", ...heading }: CtaBandProps) {
  return (
    <section aria-labelledby={`${id}-title`} className="relative overflow-hidden bg-ink py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 size-[32rem] rounded-full bg-gold-light/10 blur-3xl"
      />
      <Reveal className="container-site relative flex flex-col items-center text-center">
        <SectionHeading id={`${id}-title`} tone="dark" align="center" {...heading} />
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <ButtonLink href={primaryCta.href} size="lg">
            {primaryCta.label}
          </ButtonLink>
          {secondary ? (
            <ButtonLink href={secondary.href} variant="outline-light" size="lg">
              {secondary.label}
            </ButtonLink>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
