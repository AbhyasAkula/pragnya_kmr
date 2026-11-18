import { ButtonLink } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { primaryCta } from "@/config/navigation";
import { VillaCard } from "@/components/villas/villa-card";
import type { VillaModel, VillaSectionContent } from "@/types/content";

type VillaShowcaseProps = VillaSectionContent & { villas: VillaModel[] };

export function VillaShowcase({ villas, ctaLabel, priceNote, ...heading }: VillaShowcaseProps) {
  return (
    <section id="villas" aria-labelledby="villas-title" className="section-y bg-sand">
      <div className="container-site">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading id="villas-title" {...heading} />
          <ButtonLink href={primaryCta.href} variant="outline" className="self-start md:self-auto">
            {ctaLabel}
          </ButtonLink>
        </div>

        <RevealGroup className="mt-14 grid gap-8 md:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {villas.map((villa) => (
            <RevealItem key={villa.id}>
              <VillaCard villa={villa} />
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="mt-10 text-xs text-stone">{priceNote}</p>
      </div>
    </section>
  );
}
