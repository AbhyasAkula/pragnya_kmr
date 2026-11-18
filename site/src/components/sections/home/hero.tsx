import Image from "next/image";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/button";
import { primaryCta } from "@/config/navigation";
import type { HeroContent } from "@/types/content";

/** Gentle cadence: 0.15s lead-in, 0.1s between lines. */
const riseDelay = (step: number): CSSProperties => ({ animationDelay: `${0.15 + step * 0.1}s` });

/**
 * Homepage hero. A calm, static composition: no parallax or scroll-linked
 * fading. The image settles by a barely perceptible 4% and the copy rises
 * 14px, both via CSS keyframes (globals.css) so the headline paints straight
 * from the server HTML. Reduced-motion users see the final state at once.
 */
export function Hero({ content }: { content: HeroContent }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink text-white"
    >
      <div className="absolute inset-0 -z-10 animate-settle">
        <Image
          src={content.image.src}
          alt={content.image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      {/* Legibility scrims */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/25 to-ink/85" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />

      <div className="container-site flex flex-1 flex-col justify-end pt-28 pb-8 sm:pb-12 lg:pt-32">
        <div className="max-w-3xl">
          <p className="eyebrow flex animate-rise items-center gap-4 text-gold-light" style={riseDelay(0)}>
            <span aria-hidden className="h-px w-10 bg-current" />
            {content.eyebrow}
          </p>
          {/* On laptops the headline also scales with viewport height so short screens (720–768px) fit. */}
          <h1
            id="hero-title"
            className="mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[clamp(3.75rem,9.5vh,5.5rem)]"
          >
            <span className="block animate-rise" style={riseDelay(1)}>
              {content.title}
            </span>
            <span className="block animate-rise italic text-gold-light" style={riseDelay(2)}>
              {content.titleAccent}
            </span>
          </h1>
          <p className="mt-5 max-w-xl animate-rise text-base text-white/85 sm:text-lg" style={riseDelay(3)}>
            {content.subtitle}
          </p>
          <div className="mt-8 flex animate-rise flex-col gap-3 sm:flex-row sm:gap-4" style={riseDelay(4)}>
            <ButtonLink href={primaryCta.href} size="lg">
              {primaryCta.label}
            </ButtonLink>
            <ButtonLink href={content.secondaryCta.href} variant="outline-light" size="lg">
              {content.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>

        <dl
          style={{ animationDelay: "0.7s" }}
          className="mt-10 grid animate-fade-in grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md sm:mt-12 md:grid-cols-4"
        >
          {content.facts.map((fact) => (
            <div key={fact.label} className="flex min-w-0 flex-col justify-center gap-1 bg-ink/35 px-4 py-4 sm:px-6 sm:py-5">
              <dt className="order-2 truncate text-xs font-semibold tracking-[0.14em] text-white/80 uppercase sm:tracking-[0.2em]">
                {fact.label}
              </dt>
              <dd className="order-1 font-display text-3xl leading-none text-white tabular-nums sm:text-4xl">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
