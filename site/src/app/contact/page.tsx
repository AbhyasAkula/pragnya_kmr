import { Suspense } from "react";
import { ContactActions, OfficeDetails } from "@/components/contact/contact-options";
import { ContactVisitForm, ContactVisitFormFallback } from "@/components/contact/contact-visit-form";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/sections/shared/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { getContactContent } from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Contact", href: "/contact" },
];

const FORM_ANCHOR = "book-a-visit";
const FORM_HEADING = "book-a-visit-title";

export async function generateMetadata() {
  const { hero } = await getContactContent();
  return pageMetadata({
    path: "/contact",
    title: "Contact Sales & Book a Site Visit",
    description: `${hero.description} ${siteConfig.contact.hours}.`,
    image: hero.image,
  });
}

/**
 * Sales contact page: two prominent actions (WhatsApp, Call), then a single
 * Book a Site Visit form, then slim office details.
 */
export default async function ContactPage() {
  const { hero, form, villaOptions } = await getContactContent();

  return (
    <SiteShell jsonLd={[breadcrumbJsonLd(crumbs)]}>
      <PageHero {...hero} breadcrumbs={crumbs} compact />

      {/* Primary actions, lifted onto the hero edge so they are seen first */}
      <section aria-label="Contact our sales team" className="relative z-10 -mt-10 sm:-mt-14">
        <div className="container-site">
          <ContactActions className="mx-auto max-w-5xl" />
        </div>
      </section>

      {/* Book a site visit */}
      <section id={FORM_ANCHOR} aria-labelledby={FORM_HEADING} className="pt-16 pb-20 sm:pt-20 md:pb-28">
        <div className="container-site">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <SectionHeading id={FORM_HEADING} align="center" focusable {...form} />
            </Reveal>
            <div className="mt-10 rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgba(28,25,23,0.45)] sm:p-10">
              <Suspense fallback={<ContactVisitFormFallback villas={villaOptions} />}>
                <ContactVisitForm villas={villaOptions} anchorId={FORM_ANCHOR} headingId={FORM_HEADING} />
              </Suspense>
            </div>
          </div>

          <OfficeDetails className="mx-auto mt-14 max-w-5xl border-t border-line pt-10" />
        </div>
      </section>
    </SiteShell>
  );
}
