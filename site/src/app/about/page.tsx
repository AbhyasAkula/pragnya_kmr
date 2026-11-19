import { Eye, Hammer, Leaf, MessagesSquare, Target, Users, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/sections/shared/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig, siteUrl } from "@/config/site";
import type { CompanyValueIcon } from "@/content/company";
import { getAboutContent, getVillaModels } from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/seo";
import { formatNumber } from "@/lib/utils";

const crumbs: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
];

const valueIcons: Record<CompanyValueIcon, LucideIcon> = {
  craft: Hammer,
  transparency: MessagesSquare,
  nature: Leaf,
  community: Users,
};

export async function generateMetadata() {
  const { hero, company } = await getAboutContent();
  return pageMetadata({
    path: "/about",
    title: `About ${company.name}`,
    description: `${company.shortDescription} ${hero.description}`,
    image: hero.image,
  });
}

export default async function AboutPage() {
  const [{ hero, storyImage, values, project, company, facts }, villas] = await Promise.all([
    getAboutContent(),
    getVillaModels(),
  ]);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.shortDescription,
    ...(siteUrl ? { url: siteUrl.toString() } : {}),
  };

  const projectFacts = [
    { value: `${facts.landAcres}`, label: "Acres" },
    { value: `${facts.villaCount}`, label: "Villas" },
    { value: `${facts.openSpacePercent}%`, label: "Open space" },
    { value: `${formatNumber(facts.clubhouseSqFt)}`, label: "Sq ft clubhouse" },
  ];

  return (
    <SiteShell jsonLd={[organizationJsonLd, breadcrumbJsonLd(crumbs)]}>
      <PageHero {...hero} breadcrumbs={crumbs} />

      {/* Company story */}
      <section aria-labelledby="story-title" className="section-y">
        <div className="container-site grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-6">
            <SectionHeading id="story-title" {...company.story} />
            <div className="mt-8 space-y-5 text-stone">
              {company.story.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="relative aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-[4/3] lg:col-span-5 lg:col-start-8 lg:aspect-[4/5]">
            <Image src={storyImage.src} alt={storyImage.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>

      {/* Vision & mission */}
      <section aria-label="Vision and mission" className="bg-ink py-20 text-ivory md:py-24">
        <RevealGroup className="container-site grid gap-6 md:grid-cols-2">
          {[
            { ...company.vision, icon: Eye },
            { ...company.mission, icon: Target },
          ].map(({ title, text, icon: Icon }) => (
            <RevealItem key={title} className="rounded-[1.75rem] border border-white/10 p-8 sm:p-10">
              <Icon className="size-6 text-gold-light" strokeWidth={1.5} aria-hidden />
              <h2 className="mt-5 text-3xl sm:text-4xl">{title}</h2>
              <p className="mt-4 text-lg text-mist">{text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Values */}
      <section aria-labelledby="values-title" className="section-y">
        <div className="container-site">
          <Reveal>
            <SectionHeading id="values-title" {...values} />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {company.values.map((v) => {
              const Icon = valueIcons[v.icon];
              return (
                <RevealItem key={v.title} className="h-full rounded-2xl border border-line bg-white/60 p-7">
                  <span className="inline-flex size-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-2xl text-ink">{v.title}</h3>
                  <p className="mt-2 text-stone">{v.text}</p>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Commitment to quality */}
      <section aria-labelledby="quality-title" className="section-y bg-sand">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <SectionHeading id="quality-title" {...company.quality} />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
            <ol className="divide-y divide-line border-y border-line">
              {company.quality.commitments.map((c, i) => (
                <li key={c.title} className="flex gap-6 py-6">
                  <span className="font-display text-3xl text-gold tabular-nums" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-2xl text-ink">{c.title}</h3>
                    <p className="mt-1.5 text-stone">{c.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* First project — project information, kept separate from the company story */}
      <section aria-labelledby="project-title" className="section-y">
        <div className="container-site">
          <Reveal>
            <SectionHeading
              id="project-title"
              {...project}
              description={`${siteConfig.name} is a gated community of ${facts.villaCount} villas in ${villas.length} models — ${villas.map((v) => v.name).join(", ")} — set around a central park and clubhouse.`}
            />
          </Reveal>
          <RevealGroup className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line lg:grid-cols-4">
            {projectFacts.map((f) => (
              <RevealItem key={f.label} className="flex flex-col items-center gap-2 bg-ivory px-4 py-10 text-center">
                <span className="font-display text-4xl text-ink tabular-nums sm:text-5xl">{f.value}</span>
                <span className="eyebrow text-stone">{f.label}</span>
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <ButtonLink href="/villas" variant="dark" size="lg">
              Explore the villas
            </ButtonLink>
            <ButtonLink href="/master-plan" variant="outline" size="lg">
              View the master plan
            </ButtonLink>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
