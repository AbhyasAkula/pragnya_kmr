import { Suspense } from "react";
import { ContactActions, ProjectLocationCard, contactCard } from "@/components/contact/contact-options";
import { ContactVisitForm, ContactVisitFormFallback } from "@/components/contact/contact-visit-form";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/sections/shared/page-hero";
import { getContactContent, getContactDetails, getSiteSettings } from "@/lib/data";
import { breadcrumbJsonLd, pageMetadata, type Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";

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
    description: `${hero.description} ${(await getContactDetails()).hours}.`,
    image: hero.image,
  });
}

/**
 * Sales contact page.
 * Desktop: WhatsApp, Call and Project Location cards on the left; the Book a
 * Site Visit form on the right. Phones: WhatsApp → Call → form → location.
 */
export default async function ContactPage() {
  const [{ hero, form, villaOptions, locationImage }, contactInfo, settings] = await Promise.all([
    getContactContent(),
    getContactDetails(),
    getSiteSettings(),
  ]);
  const context = { contactInfo, bookingsOpen: settings.acceptingOnlineBookings, privacyPolicyUrl: settings.privacyPolicyUrl };

  return (
    <SiteShell jsonLd={[breadcrumbJsonLd(crumbs)]}>
      <PageHero {...hero} breadcrumbs={crumbs} size="banner" />

      <section aria-label="Contact options and site visit booking" className="py-12 sm:py-16 lg:py-20">
        <div className="container-site grid gap-5 lg:grid-cols-12 lg:items-start lg:gap-x-10">
          {/* Left column. On phones `contents` lets its cards interleave with the form
              (WhatsApp → Call → form → location); on desktop it stays in view beside the form. */}
          <div className="contents lg:sticky lg:top-28 lg:col-span-5 lg:block lg:space-y-5">
            <ContactActions className="order-1 lg:order-none" />
            <ProjectLocationCard image={locationImage} className="order-3 lg:order-none" />
          </div>

          {/* Booking form */}
          <div
            id={FORM_ANCHOR}
            className={cn(contactCard, "order-2 p-6 sm:p-8 lg:order-none lg:col-span-7 lg:col-start-6 lg:p-10")}
          >
            <p className="eyebrow flex items-center gap-4 text-gold">
              <span aria-hidden className="h-px w-10 bg-current opacity-60" />
              {form.eyebrow}
            </p>
            <h2 id={FORM_HEADING} tabIndex={-1} className="mt-4 text-4xl text-ink sm:text-[2.75rem]">
              {form.title}
            </h2>
            <p className="mt-3 max-w-md text-stone">{form.description}</p>
            <div className="mt-8 border-t border-line pt-8">
              <Suspense fallback={<ContactVisitFormFallback villas={villaOptions} context={context} />}>
                <ContactVisitForm villas={villaOptions} anchorId={FORM_ANCHOR} headingId={FORM_HEADING} context={context} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
