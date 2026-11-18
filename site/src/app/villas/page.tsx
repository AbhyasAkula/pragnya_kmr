import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/sections/shared/cta-band";
import { PageHero } from "@/components/sections/shared/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { VillaCard } from "@/components/villas/villa-card";
import { VillaComparison } from "@/components/villas/villa-details";
import { primaryCta } from "@/config/navigation";
import { getVillaModels, getVillaSection, getVillasPageContent } from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Villas", href: "/villas" },
];

export async function generateMetadata() {
  const { hero } = await getVillasPageContent();
  return pageMetadata({
    path: "/villas",
    title: "Villas — 3 & 4 BHK Models",
    description: hero.description,
    image: hero.image,
  });
}

export default async function VillasPage() {
  const [{ hero, listing, comparison, cta }, villas, { priceNote }] = await Promise.all([
    getVillasPageContent(),
    getVillaModels(),
    getVillaSection(),
  ]);

  return (
    <SiteShell jsonLd={[breadcrumbJsonLd(crumbs)]}>
      <PageHero {...hero} breadcrumbs={crumbs}>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <ButtonLink href={primaryCta.href} size="lg">
            {primaryCta.label}
          </ButtonLink>
          <ButtonLink href="#compare" variant="outline-light" size="lg">
            Compare models
          </ButtonLink>
        </div>
      </PageHero>

      <section aria-labelledby="listing-title" className="section-y">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="listing-title" {...listing} />
          </Reveal>
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

      <section id="compare" aria-labelledby="compare-title" className="section-y bg-sand">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="compare-title" {...comparison} />
          </Reveal>
          <Reveal className="mt-12 lg:mt-16">
            <VillaComparison villas={villas} caption="Comparison of villa models" />
          </Reveal>
          <p className="mt-6 text-xs text-stone">{priceNote}</p>
        </div>
      </section>

      <CtaBand {...cta} secondary={{ label: "View master plan", href: "/master-plan" }} />
    </SiteShell>
  );
}
