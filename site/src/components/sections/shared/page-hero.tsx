import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import type { Crumb } from "@/lib/seo";
import type { ImageAsset } from "@/types/content";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  image: ImageAsset;
  breadcrumbs: Crumb[];
  /** Actions, facts strip or other content under the intro. */
  children?: ReactNode;
};

/** Same cadence as the homepage hero: 0.2s lead-in, 0.12s between lines. */
const riseDelay = (step: number): CSSProperties => ({ animationDelay: `${0.2 + step * 0.12}s` });

/**
 * Interior-page hero in the homepage's visual language (full-bleed image,
 * ink scrims, gold eyebrow, serif headline with italic accent). Server
 * component; entrance uses CSS keyframes so content never waits for JS.
 */
export function PageHero({ eyebrow, title, accent, description, image, breadcrumbs, children }: PageHeroProps) {
  return (
    <section
      aria-labelledby="page-title"
      className="relative isolate flex min-h-[78svh] flex-col overflow-hidden bg-ink text-white lg:min-h-[72svh]"
    >
      <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/75 via-ink/35 to-ink/90" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />

      <div className="container-site flex flex-1 flex-col justify-end pt-32 pb-12 sm:pb-16">
        <Breadcrumbs items={breadcrumbs} className="animate-rise" />
        <div className="mt-8 max-w-3xl">
          <p className="eyebrow flex animate-rise items-center gap-4 text-gold-light" style={riseDelay(0)}>
            <span aria-hidden className="h-px w-10 bg-current" />
            {eyebrow}
          </p>
          <h1 id="page-title" className="mt-6 text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-7xl">
            <span className="block animate-rise" style={riseDelay(1)}>
              {title}
            </span>
            {accent ? (
              <span className="block animate-rise italic text-gold-light" style={riseDelay(2)}>
                {accent}
              </span>
            ) : null}
          </h1>
          {description ? (
            <p className="mt-6 max-w-xl animate-rise text-base text-white/85 sm:text-lg" style={riseDelay(3)}>
              {description}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="animate-rise" style={riseDelay(4)}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
