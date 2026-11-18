import { AmenityIcon } from "@/components/amenities/amenity-icon";
import Image from "next/image";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Amenity, AmenitiesSectionContent } from "@/types/content";

type AmenitiesProps = AmenitiesSectionContent & { items: Amenity[] };

export function Amenities({ items, featureImage, featureCaption, ...heading }: AmenitiesProps) {
  return (
    <section
      id="amenities"
      aria-labelledby="amenities-title"
      className="section-y relative overflow-hidden bg-ink text-ivory"
    >
      {/* Decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-gold-light/10 blur-3xl"
      />

      <div className="container-site relative grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionHeading id="amenities-title" tone="dark" {...heading} />
          </Reveal>
          <Reveal delay={0.15} className="relative mt-12 aspect-[4/3] overflow-hidden rounded-[1.75rem] lg:aspect-[5/4]">
            <Image
              src={featureImage.src}
              alt={featureImage.alt}
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <p className="absolute bottom-6 left-6 font-display text-2xl italic text-ivory">
              {featureCaption}
            </p>
          </Reveal>
        </div>

        <RevealGroup className="grid content-start gap-px self-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:col-span-7">
          {items.map((amenity) => {
            return (
              <RevealItem key={amenity.id}>
                {/* Hover transition lives on this inner element; the reveal owns the outer one. */}
                <div className="group flex h-full gap-5 bg-ink p-7 transition-colors duration-500 ease-luxe hover:bg-ink-soft sm:p-8">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-gold-light/40 text-gold-light transition-colors duration-500 group-hover:bg-gold-light group-hover:text-ink">
                    <AmenityIcon name={amenity.icon} className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl text-ivory">{amenity.title}</h3>
                    <p className="mt-2 text-sm text-mist">{amenity.description}</p>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
