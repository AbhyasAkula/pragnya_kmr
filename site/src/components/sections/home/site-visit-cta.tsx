import { CalendarCheck, Car, Clock, Phone, Sparkles, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { phoneHref } from "@/lib/contact";
import { getContactDetails, getSiteSettings } from "@/lib/data";
import type { SiteVisitContent, SiteVisitPerkIcon } from "@/types/content";
import { SiteVisitForm } from "./site-visit-form";

const perkIcons: Record<SiteVisitPerkIcon, LucideIcon> = {
  car: Car,
  sparkles: Sparkles,
  calendar: CalendarCheck,
};

type SiteVisitCtaProps = SiteVisitContent & { villaOptions: string[]; defaultVilla?: string };

export async function SiteVisitCta({
  image,
  formTitle,
  formSubtitle,
  perks,
  villaOptions,
  defaultVilla,
  ...heading
}: SiteVisitCtaProps) {
  const [contact, settings] = await Promise.all([getContactDetails(), getSiteSettings()]);
  const items: { icon: LucideIcon; text: string; href?: string }[] = [
    ...perks.map((p) => ({ icon: perkIcons[p.icon], text: p.text })),
    { icon: Clock, text: contact.hours },
    { icon: Phone, text: contact.phone, href: phoneHref(contact) },
  ];

  return (
    <section id="site-visit" aria-labelledby="site-visit-title" className="relative isolate overflow-hidden bg-ink py-20 md:py-28 lg:py-32">
      <Image src={image.src} alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/80 lg:bg-gradient-to-r lg:from-ink/95 lg:via-ink/80 lg:to-ink/40" />

      <div className="container-site grid items-center gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <SectionHeading id="site-visit-title" tone="dark" {...heading} />
          <ul className="mt-10 space-y-4">
            {items.map(({ icon: Icon, text, href }) => (
              <li key={text} className="flex items-center gap-4 text-ivory">
                <span className="inline-flex size-10 items-center justify-center rounded-full border border-gold-light/40 text-gold-light">
                  <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
                {href ? (
                  <a href={href} className="hover:text-gold-light">
                    {text}
                  </a>
                ) : (
                  text
                )}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <div className="relative rounded-[1.75rem] bg-ivory p-6 shadow-2xl sm:p-10">
            <p className="font-display text-3xl text-ink">{formTitle}</p>
            <p className="mt-2 mb-8 text-sm text-stone">{formSubtitle}</p>
            <SiteVisitForm
              villaOptions={villaOptions}
              defaultVilla={defaultVilla}
              contactInfo={contact}
              bookingsOpen={settings.acceptingOnlineBookings}
              privacyPolicyUrl={settings.privacyPolicyUrl}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
