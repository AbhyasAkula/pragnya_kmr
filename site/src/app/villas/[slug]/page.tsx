import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteVisitCta } from "@/components/sections/home/site-visit-cta";
import { PageHero } from "@/components/sections/shared/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { FloorPlans } from "@/components/villas/floor-plans";
import { VillaCard, villaPath, villaStatusLabel } from "@/components/villas/villa-card";
import {
  Specifications,
  VillaHighlights,
  VillaKeyFacts,
  VillaSpecList,
} from "@/components/villas/villa-details";
import { VillaGallery } from "@/components/villas/villa-gallery";
import {
  getSiteVisitContent,
  getVillaBySlug,
  getVillaDetailCopy,
  getVillaModels,
  getVillaSection,
  getVillaSlugs,
  getVillaSpecifications,
} from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, villaJsonLd, type Crumb } from "@/lib/seo";
import { cn, formatPriceINR } from "@/lib/utils";

/** Every villa is prerendered at build time; unknown slugs 404 via notFound(). */
export async function generateStaticParams() {
  return (await getVillaSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/villas/[slug]">) {
  const { slug } = await params;
  const villa = await getVillaBySlug(slug);
  if (!villa) return {};
  return pageMetadata({
    path: villaPath(villa.slug),
    title: `${villa.name} — ${villa.configuration}`,
    description: `${villa.summary} ${villa.bedrooms} bedrooms, ${villa.builtUpArea.toLocaleString("en-IN")} sq ft on a ${villa.plotArea} sq yd plot.`,
    image: villa.image,
  });
}

export default async function VillaPage({ params }: PageProps<"/villas/[slug]">) {
  const { slug } = await params;
  const villa = await getVillaBySlug(slug);
  if (!villa) notFound();

  const [allVillas, specs, copy, siteVisit, { priceNote }] = await Promise.all([
    getVillaModels(),
    getVillaSpecifications(),
    getVillaDetailCopy(),
    getSiteVisitContent(),
    getVillaSection(),
  ]);
  const others = allVillas.filter((v) => v.slug !== villa.slug);
  const path = villaPath(villa.slug);
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Villas", href: "/villas" },
    { label: villa.name, href: path },
  ];

  return (
    <SiteShell jsonLd={[villaJsonLd(villa, path), breadcrumbJsonLd(crumbs)]}>
      <PageHero
        eyebrow={villa.configuration}
        title={villa.name}
        description={villa.summary}
        image={villa.image}
        breadcrumbs={crumbs}
      >
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <ButtonLink href="#site-visit" size="lg">
            Book a site visit
          </ButtonLink>
          <ButtonLink href="#floor-plans" variant="outline-light" size="lg">
            View floor plans
          </ButtonLink>
        </div>
        <VillaKeyFacts villa={villa} />
      </PageHero>

      {/* Overview + sticky summary */}
      <section aria-labelledby="residence-title" className="section-y">
        <div className="container-site grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionHeading id="residence-title" {...copy.overview} />
              <div className="mt-8 space-y-5 text-stone">
                {villa.description.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
              </div>
            </Reveal>
            <div className="mt-12">
              <VillaHighlights items={villa.highlights} />
            </div>
          </div>

          <aside aria-label={`${villa.name} summary`} className="lg:col-span-4 lg:col-start-9">
            <div className="rounded-[1.75rem] bg-white p-7 shadow-[0_30px_60px_-40px_rgba(28,25,23,0.45)] sm:p-8 lg:sticky lg:top-28">
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow text-xs text-gold">{villa.configuration}</p>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase",
                    villa.status === "limited" ? "bg-gold-light text-ink" : "bg-sand text-ink",
                  )}
                >
                  {villaStatusLabel[villa.status]}
                </span>
              </div>
              <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-stone uppercase">Starting from</p>
              <p className="font-display text-4xl text-ink tabular-nums">{formatPriceINR(villa.startingPrice)}*</p>
              <VillaSpecList villa={villa} className="mt-6 border-t border-line" />
              <div className="mt-8 flex flex-col gap-3">
                <ButtonLink href="#site-visit" variant="dark" className="w-full">
                  Book a site visit
                </ButtonLink>
                <ButtonLink href="#floor-plans" variant="outline" className="w-full">
                  View floor plans
                </ButtonLink>
              </div>
              <p className="mt-5 text-xs text-stone">{priceNote}</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="gallery" aria-labelledby="gallery-title" className="section-y bg-sand">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="gallery-title" {...copy.gallery} />
          </Reveal>
          <div className="mt-12 lg:mt-16">
            <VillaGallery images={villa.gallery} villaName={villa.name} />
          </div>
        </div>
      </section>

      <section id="floor-plans" aria-labelledby="floor-plans-title" className="section-y">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="floor-plans-title" {...copy.floorPlans} />
          </Reveal>
          <Reveal className="mt-12">
            <FloorPlans levels={villa.floorPlans} villaName={villa.name} note={specs.floorPlanNote} />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="specs-title" className="section-y bg-sand">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="specs-title" {...copy.specifications} />
          </Reveal>
          <div className="mt-12 lg:mt-16">
            <Specifications groups={specs.groups} note={specs.note} />
          </div>
        </div>
      </section>

      {others.length > 0 ? (
        <section aria-labelledby="others-title" className="section-y">
          <div className="container-site">
            <Reveal>
              <SectionHeading id="others-title" {...copy.others} />
            </Reveal>
            <RevealGroup className="mt-12 grid gap-8 md:grid-cols-2 lg:mt-16">
              {others.map((v) => (
                <RevealItem key={v.id}>
                  <VillaCard villa={v} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      ) : null}

      <SiteVisitCta
        {...siteVisit}
        title={`See ${villa.name} in person`}
        defaultVilla={villa.name}
      />
    </SiteShell>
  );
}
