import { Info } from "lucide-react";
import Image from "next/image";
import { MilestoneTimeline, ProgressBar } from "@/components/construction/progress";
import { SiteShell } from "@/components/layout/site-shell";
import { MediaGrid } from "@/components/media/media-grid";
import { PageHero } from "@/components/sections/shared/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { MediaBadge } from "@/components/ui/media-badge";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getConstructionContent } from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { ConstructionUpdate } from "@/types/content";

const crumbs: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Construction progress", href: "/construction-progress" },
];

/** "2026-11-10" → "10 November 2026" (fixed locale/time zone: stable across server and client). */
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export async function generateMetadata() {
  const { hero } = await getConstructionContent();
  return pageMetadata({ path: "/construction-progress", title: "Construction Progress", description: hero.description, image: hero.image });
}

function SampleTag({ update, onDark = false }: { update: ConstructionUpdate; onDark?: boolean }) {
  if (!update.sample) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-[0.12em] text-ink uppercase",
        onDark ? "bg-gold-light" : "border border-gold/40 bg-gold-light/20",
      )}
    >
      Sample update
    </span>
  );
}

export default async function ConstructionProgressPage() {
  const { hero, latest, milestones: milestoneCopy, history, milestoneList, latestUpdate, earlierUpdates, notice } =
    await getConstructionContent();
  const [lead, ...moreMedia] = latestUpdate.media;

  return (
    <SiteShell jsonLd={[breadcrumbJsonLd(crumbs)]}>
      <PageHero {...hero} breadcrumbs={crumbs}>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <ButtonLink href="#latest-update" size="lg">
            See the latest update
          </ButtonLink>
          <ButtonLink href="#milestones" variant="outline-light" size="lg">
            View milestones
          </ButtonLink>
        </div>
      </PageHero>

      {/* Latest update — featured */}
      <section id="latest-update" aria-labelledby="latest-title" className="section-y">
        <div className="container-site">
          <p className="mb-10 flex gap-3 rounded-xl border border-gold/30 bg-gold-light/15 px-4 py-3 text-sm text-ink">
            <Info className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            {notice}
          </p>
          <Reveal>
            <SectionHeading id="latest-title" {...latest} />
          </Reveal>

          <Reveal className="mt-12 overflow-hidden rounded-[2rem] bg-ink text-ivory lg:mt-16">
            <article aria-labelledby="latest-update-title" className="grid lg:grid-cols-12">
              <div className="relative aspect-[4/3] lg:col-span-7 lg:aspect-auto lg:min-h-[30rem]">
                <Image src={lead.src} alt={lead.alt} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
                <MediaBadge source={lead.source} className="absolute top-4 left-4" long />
              </div>
              <div className="flex flex-col p-7 sm:p-10 lg:col-span-5">
                <div className="flex flex-wrap items-center gap-3">
                  <time dateTime={latestUpdate.date} className="text-sm font-semibold tracking-[0.14em] text-gold-light uppercase">
                    {formatDate(latestUpdate.date)}
                  </time>
                  <SampleTag update={latestUpdate} onDark />
                </div>
                <h3 id="latest-update-title" className="mt-4 text-3xl sm:text-4xl">
                  {latestUpdate.title}
                </h3>
                <p className="mt-4 text-mist">{latestUpdate.summary}</p>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <ProgressBar label="Overall progress" value={latestUpdate.overallProgress} tone="dark" />
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {latestUpdate.areas.map((a) => (
                    <ProgressBar key={a.label} label={a.label} value={a.progress} tone="dark" />
                  ))}
                </div>
              </div>
            </article>
          </Reveal>

          {moreMedia.length > 0 ? (
            <div className="mt-8">
              <h3 className="mb-4 text-xs font-semibold tracking-[0.14em] text-ink uppercase">Photos & videos from this update</h3>
              <MediaGrid
                items={moreMedia}
                columnsClassName="grid-cols-1 sm:grid-cols-3"
                sizes="(min-width: 1280px) 400px, (min-width: 640px) 33vw, 100vw"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Milestones */}
      <section id="milestones" aria-labelledby="milestones-title" className="section-y bg-sand">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <SectionHeading id="milestones-title" {...milestoneCopy} />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
            <MilestoneTimeline milestones={milestoneList} />
          </Reveal>
        </div>
      </section>

      {/* Earlier updates */}
      {earlierUpdates.length > 0 ? (
        <section aria-labelledby="history-title" className="section-y">
          <div className="container-site">
            <Reveal>
              <SectionHeading id="history-title" {...history} />
            </Reveal>
            <RevealGroup className="mt-12 space-y-12 lg:mt-16">
              {earlierUpdates.map((u) => (
                <RevealItem key={u.id}>
                  <article aria-labelledby={`${u.id}-title`} className="grid gap-6 border-t border-line pt-10 lg:grid-cols-12 lg:gap-12">
                    <div className="lg:col-span-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <time dateTime={u.date} className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">
                          {formatDate(u.date)}
                        </time>
                        <SampleTag update={u} />
                      </div>
                      <h3 id={`${u.id}-title`} className="mt-3 text-3xl text-ink">
                        {u.title}
                      </h3>
                      <p className="mt-3 text-stone">{u.summary}</p>
                      <div className="mt-6">
                        <ProgressBar label="Overall progress" value={u.overallProgress} />
                      </div>
                    </div>
                    <div className="lg:col-span-8">
                      <MediaGrid
                        items={u.media}
                        columnsClassName="grid-cols-1 sm:grid-cols-2"
                        sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    </div>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}
