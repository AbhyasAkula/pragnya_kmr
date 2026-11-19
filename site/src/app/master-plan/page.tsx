import { ArrowUpRight, Check, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { PlanDiagram, zoneSwatch } from "@/components/master-plan/plan-diagram";
import { PlanLegend } from "@/components/master-plan/plan-legend";
import { PlanViewer } from "@/components/master-plan/plan-viewer";
import { PageHero } from "@/components/sections/shared/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { villaPath } from "@/components/villas/villa-card";
import { getMasterPlanContent, getProjectFacts, getVillaModels } from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/seo";
import { cn, formatNumber } from "@/lib/utils";

const crumbs: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Master plan", href: "/master-plan" },
];

export async function generateMetadata() {
  const { hero } = await getMasterPlanContent();
  return pageMetadata({ path: "/master-plan", title: "Master Plan", description: hero.description, image: hero.image });
}

export default async function MasterPlanPage() {
  const [content, facts, villas] = await Promise.all([getMasterPlanContent(), getProjectFacts(), getVillaModels()]);
  const { hero, plan, highlights, points, models } = content;

  const stats = [
    { value: facts.landAcres, label: "Acres" },
    { value: facts.villaCount, label: "Villas" },
    { value: facts.openSpacePercent, suffix: "%", label: "Open space" },
    { value: Math.round(facts.clubhouseSqFt / 1000), suffix: "K", label: "Sq ft clubhouse" },
  ];

  return (
    <SiteShell jsonLd={[breadcrumbJsonLd(crumbs)]}>
      <PageHero {...hero} breadcrumbs={crumbs}>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <ButtonLink href="/villas" variant="outline-light" size="lg">
            View villas
          </ButtonLink>
        </div>
      </PageHero>

      {/* Zoomable plan + legend */}
      <section id="plan" aria-labelledby="plan-title" className="section-y">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="plan-title" eyebrow={plan.eyebrow} title={plan.title} accent={plan.accent} description={plan.description} />
          </Reveal>

          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-12">
            <Reveal className="lg:col-span-8">
              <PlanViewer label="Master plan" aspectRatio={`${plan.canvas.width} / ${plan.canvas.height}`}>
                {plan.drawing ? (
                  <Image src={plan.drawing.src} alt={plan.drawing.alt} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-contain" />
                ) : (
                  <PlanDiagram
                    zones={plan.zones}
                    width={plan.canvas.width}
                    height={plan.canvas.height}
                    title={`Placeholder master plan diagram with ${plan.zones.length} numbered zones; see the legend for details.`}
                  />
                )}
              </PlanViewer>
              {!plan.drawing ? (
                <p className="mt-4 flex gap-3 rounded-xl border border-gold/30 bg-gold-light/15 px-4 py-3 text-sm text-ink">
                  <Info className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                  {plan.disclaimer}
                </p>
              ) : null}
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-4">
              <h3 className="mb-4 text-xs font-semibold tracking-[0.14em] text-ink uppercase">Legend</h3>
              <PlanLegend zones={plan.zones} villas={villas} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section aria-labelledby="highlights-title" className="section-y bg-sand">
        <div className="container-site grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHeading id="highlights-title" {...highlights} />
            </Reveal>
            <RevealGroup className="mt-10 space-y-4">
              {points.map((item) => (
                <RevealItem key={item} className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-light/25 text-gold">
                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="text-ink">{item}</span>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
          <RevealGroup className="grid grid-cols-2 gap-px self-center overflow-hidden rounded-[1.75rem] border border-line bg-line lg:col-span-6 lg:col-start-7">
            {stats.map((stat) => (
              <RevealItem key={stat.label} className="flex flex-col items-center gap-2 bg-ivory px-4 py-10 text-center sm:py-14">
                <span className="font-display text-5xl text-ink tabular-nums sm:text-6xl">{`${stat.value}${stat.suffix ?? ""}`}</span>
                <span className="eyebrow text-xs text-stone">{stat.label}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Villa models by precinct */}
      <section aria-labelledby="models-title" className="section-y">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="models-title" {...models} />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-3">
            {villas.map((villa) => {
              const zone = plan.zones.find((z) => z.villaSlug === villa.slug);
              return (
                <RevealItem key={villa.id}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white/60 transition-shadow duration-500 ease-luxe hover:shadow-[0_30px_60px_-40px_rgba(28,25,23,0.5)]">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={villa.image.src}
                        alt={villa.image.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-7">
                      {zone ? (
                        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-stone uppercase">
                          <span aria-hidden className={cn("size-3 rounded-full", zoneSwatch[zone.tone])} />
                          Zone {zone.marker} · {zone.label}
                        </p>
                      ) : null}
                      <h3 className="mt-3 text-3xl text-ink">{villa.name}</h3>
                      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-5 text-center tabular-nums">
                        <div>
                          <dt className="text-xs font-semibold tracking-[0.14em] text-stone uppercase">Homes</dt>
                          <dd className="mt-1 font-display text-2xl text-ink">{villa.unitCount}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold tracking-[0.14em] text-stone uppercase">Plot</dt>
                          <dd className="mt-1 font-display text-2xl text-ink">{villa.plotArea}<span className="text-sm"> sq yd</span></dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold tracking-[0.14em] text-stone uppercase">Built-up</dt>
                          <dd className="mt-1 font-display text-2xl text-ink">{formatNumber(villa.builtUpArea)}</dd>
                        </div>
                      </dl>
                      <Link
                        href={villaPath(villa.slug)}
                        className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold after:absolute after:inset-0 hover:underline"
                      >
                        Explore {villa.name}
                        <ArrowUpRight className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </article>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>
    </SiteShell>
  );
}
