import { Check } from "lucide-react";
import Image from "next/image";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import type { ProjectOverview } from "@/types/content";

export function Overview({ content }: { content: ProjectOverview }) {
  return (
    <section id="overview" aria-labelledby="overview-title" className="section-y overflow-hidden">
      <div className="container-site grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
        {/* Image composition */}
        <Reveal className="relative lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-[5/5] lg:aspect-[4/5]">
            <Image
              src={content.images.primary.src}
              alt={content.images.primary.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -right-2 -bottom-10 hidden w-[46%] overflow-hidden rounded-2xl border-[6px] border-ivory shadow-2xl sm:block lg:-right-10">
            <div className="relative aspect-[4/5]">
              <Image
                src={content.images.secondary.src}
                alt={content.images.secondary.alt}
                fill
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute top-6 left-6 rounded-full bg-ivory/90 px-5 py-2.5 backdrop-blur">
            <p className="eyebrow text-xs text-ink">{content.badge}</p>
          </div>
        </Reveal>

        {/* Copy */}
        <div className="lg:col-span-5 lg:col-start-8">
          <Reveal>
            <SectionHeading id="overview-title" eyebrow={content.eyebrow} title={content.title} />
            <div className="mt-8 space-y-5 text-stone">
              {content.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </Reveal>

          <RevealGroup className="mt-10 space-y-4">
            {content.highlights.map((item) => (
              <RevealItem key={item} className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-light/25 text-gold">
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="text-ink">{item}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>

      {/* Stats band */}
      <div className="container-site mt-24 lg:mt-32">
        <RevealGroup className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {content.stats.map((stat, i) => (
            <RevealItem
              key={stat.label}
              className={cn(
                "flex flex-col items-center gap-2 border-line px-4 py-10 text-center",
                i % 2 === 1 && "border-l",
                i >= 2 && "border-t lg:border-t-0",
                i === 2 && "lg:border-l",
              )}
            >
              <span className="font-display text-5xl text-ink tabular-nums sm:text-6xl">
                {`${stat.prefix ?? ""}${stat.value}${stat.suffix ?? ""}`}
              </span>
              <span className="eyebrow text-xs text-stone">{stat.label}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
