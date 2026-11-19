import { Camera, Info, PenTool } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { GalleryBrowser } from "@/components/media/gallery-browser";
import { PageHero } from "@/components/sections/shared/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getGalleryPageContent } from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Gallery", href: "/gallery" },
];

export async function generateMetadata() {
  const { hero } = await getGalleryPageContent();
  return pageMetadata({ path: "/gallery", title: "Gallery", description: hero.description, image: hero.image });
}

export default async function GalleryPage() {
  const { hero, browse, categories, items, notice } = await getGalleryPageContent();

  return (
    <SiteShell jsonLd={[breadcrumbJsonLd(crumbs)]}>
      <PageHero {...hero} breadcrumbs={crumbs} />

      <section aria-labelledby="browse-title" className="section-y">
        <div className="container-site">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <SectionHeading id="browse-title" {...browse} />
            </Reveal>
            {/* Key to the labels on every tile */}
            <Reveal delay={0.1}>
              <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink">
                <div className="flex items-center gap-2">
                  <dt className="inline-flex size-8 items-center justify-center rounded-full bg-ink text-ivory">
                    <PenTool className="size-4" aria-hidden />
                    <span className="sr-only">Render</span>
                  </dt>
                  <dd>Render — artist&apos;s impression</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="inline-flex size-8 items-center justify-center rounded-full bg-ink text-ivory">
                    <Camera className="size-4" aria-hidden />
                    <span className="sr-only">Photo</span>
                  </dt>
                  <dd>Photo — actual photograph</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <p className="mt-8 flex gap-3 rounded-xl border border-gold/30 bg-gold-light/15 px-4 py-3 text-sm text-ink">
            <Info className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            {notice}
          </p>

          <div className="mt-10">
            <GalleryBrowser items={items} categories={categories} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
