import { Check } from "lucide-react";
import Image from "next/image";
import { AmenityIcon } from "@/components/amenities/amenity-icon";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/sections/shared/cta-band";
import { PageHero } from "@/components/sections/shared/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAmenitiesPageContent } from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";

const crumbs: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Amenities", href: "/amenities" },
];

const categoryAnchor = (id: string) => `amenities-${id}`;

export async function generateMetadata() {
  const { hero } = await getAmenitiesPageContent();
  return pageMetadata({ path: "/amenities", title: "Amenities", description: hero.description, image: hero.image });
}

export default async function AmenitiesPage() {
  const { hero, categoriesIntro, cta, categories, amenities, features } = await getAmenitiesPageContent();
  const grouped = categories
    .map((category) => ({ category, items: amenities.filter((a) => a.category === category.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <SiteShell jsonLd={[breadcrumbJsonLd(crumbs)]}>
      <PageHero {...hero} breadcrumbs={crumbs}>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <ButtonLink href="#all-amenities" size="lg">
            Browse all amenities
          </ButtonLink>
          <ButtonLink href="/master-plan" variant="outline-light" size="lg">
            See them on the plan
          </ButtonLink>
        </div>
      </PageHero>

      {/* Feature bands — alternating image / copy */}
      <section aria-label="Amenity highlights" className="section-y">
        <div className="container-site space-y-20 lg:space-y-28">
          {features.map((feature, i) => {
            const reversed = i % 2 === 1;
            return (
              <article key={feature.id} aria-labelledby={`${feature.id}-title`} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
                <Reveal className={cn("relative lg:col-span-7", reversed && "lg:order-2 lg:col-start-6")}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] lg:aspect-[16/11]">
                    <Image
                      src={feature.image.src}
                      alt={feature.image.alt}
                      fill
                      sizes="(min-width: 1280px) 700px, (min-width: 1024px) 58vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
                <Reveal delay={0.1} className={cn("lg:col-span-5", reversed ? "lg:order-1 lg:col-start-1" : "lg:col-start-8")}>
                  <p className="eyebrow flex items-center gap-4 text-gold">
                    <span aria-hidden className="h-px w-10 bg-current opacity-60" />
                    {feature.eyebrow}
                  </p>
                  <h2 id={`${feature.id}-title`} className="mt-5 text-4xl text-ink sm:text-5xl">
                    {feature.title}
                  </h2>
                  <p className="mt-6 text-stone">{feature.description}</p>
                  <ul className="mt-8 space-y-3">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-4">
                        <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-light/25 text-gold">
                          <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                        </span>
                        <span className="text-ink">{point}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </article>
            );
          })}
        </div>
      </section>

      {/* Categorised list */}
      <section id="all-amenities" aria-labelledby="categories-title" className="section-y bg-sand">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="categories-title" {...categoriesIntro} />
          </Reveal>

          <nav aria-label="Amenity categories" className="mt-10">
            <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:px-0">
              {grouped.map(({ category, items }) => (
                <li key={category.id} className="shrink-0">
                  <a
                    href={`#${categoryAnchor(category.id)}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 bg-ivory px-5 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-ivory"
                  >
                    {category.title}
                    <span className="text-xs text-stone tabular-nums">{items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-14 space-y-16 lg:mt-20 lg:space-y-20">
            {grouped.map(({ category, items }) => (
              <section
                key={category.id}
                id={categoryAnchor(category.id)}
                aria-labelledby={`${categoryAnchor(category.id)}-title`}
                className="grid gap-8 lg:grid-cols-12 lg:gap-12"
              >
                <div className="lg:col-span-4">
                  <h3 id={`${categoryAnchor(category.id)}-title`} className="text-3xl text-ink sm:text-4xl">
                    {category.title}
                  </h3>
                  <p className="mt-3 text-stone">{category.description}</p>
                </div>
                <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
                  {items.map((amenity) => (
                    <RevealItem key={amenity.id}>
                      <div className="group flex h-full gap-5 rounded-2xl border border-line bg-ivory p-6 transition-[border-color,box-shadow,transform] duration-500 ease-luxe hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_24px_50px_-36px_rgba(28,25,23,0.55)]">
                        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors duration-500 group-hover:bg-ink group-hover:text-gold-light">
                          <AmenityIcon name={amenity.icon} className="size-5" />
                        </span>
                        <div>
                          <h4 className="font-display text-2xl text-ink">{amenity.title}</h4>
                          <p className="mt-1.5 text-sm text-stone">{amenity.description}</p>
                        </div>
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </section>
            ))}
          </div>
        </div>
      </section>

      <CtaBand {...cta} secondary={{ label: "Explore villas", href: "/villas" }} />
    </SiteShell>
  );
}
