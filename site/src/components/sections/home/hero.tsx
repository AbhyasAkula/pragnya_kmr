import { ArrowDown } from "lucide-react";
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

      <div className="container-site flex flex-1 flex-col justify-end pt-32 pb-12 sm:pb-16">
        <div className="max-w-3xl">
          <p className="eyebrow flex animate-rise items-center gap-4 text-gold-light" style={riseDelay(0)}>
            <span aria-hidden className="h-px w-10 bg-current" />
            {content.eyebrow}
          </p>
          <h1 id="hero-title" className="mt-6 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[5.5rem]">
            <span className="block animate-rise" style={riseDelay(1)}>
              {content.title}
            </span>
            <span className="block animate-rise italic text-gold-light" style={riseDelay(2)}>
              {content.titleAccent}
            </span>
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-base text-white/85 sm:text-lg" style={riseDelay(3)}>
            {content.subtitle}
          </p>
          <div className="mt-10 flex animate-rise flex-col gap-3 sm:flex-row sm:gap-4" style={riseDelay(4)}>
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
          className="mt-14 grid animate-fade-in grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md sm:mt-20 md:grid-cols-4"
        >
          {content.facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-1 bg-ink/30 px-6 py-5">
              <dt className="order-2 text-xs font-semibold tracking-[0.2em] text-white/80 uppercase">
                {fact.label}
              </dt>
              <dd className="order-1 font-display text-3xl text-white sm:text-4xl">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <a
        href="#overview"
        aria-label="Scroll to overview"
        className="absolute right-6 bottom-12 hidden size-11 items-center justify-center rounded-full border border-white/30 text-white/80 transition-colors hover:border-white hover:text-white lg:inline-flex xl:right-10"
      >
        <ArrowDown className="size-4" aria-hidden />
      </a>
    </section>
  );
}
