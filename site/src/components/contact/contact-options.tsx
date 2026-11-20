import { ArrowUpRight, ChevronRight, Clock, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { siteConfig } from "@/config/site";
import { phoneHref, whatsappHref } from "@/lib/contact";
import { getContactDetails } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types/content";

/** Shared card surface for the contact page: white on ivory, hairline border, soft layered shadow. */
export const contactCard =
  "rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_16px_36px_-24px_rgba(28,25,23,0.35)]";

/** Bronze tile used for the phone and location icons. */
const bronzeTile = "bg-gradient-to-br from-[#c4924f] to-[#94590a] text-white";

type ActionProps = {
  href: string;
  external?: boolean;
  tile: ReactNode;
  tileClassName: string;
  title: string;
  description: string;
  detail?: string;
};

function ActionCard({ href, external, tile, tileClassName, title, description, detail }: ActionProps) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        contactCard,
        "group flex items-center gap-4 p-5 transition-[border-color,box-shadow] duration-300 ease-calm hover:border-gold/45 hover:shadow-[0_1px_2px_rgba(28,25,23,0.05),0_22px_44px_-26px_rgba(28,25,23,0.45)] sm:gap-5 sm:p-6",
      )}
    >
      <span className={cn("inline-flex size-14 shrink-0 items-center justify-center rounded-xl", tileClassName)}>
        {tile}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[1.4rem] leading-tight text-ink sm:text-[1.6rem]">{title}</span>
        <span className="mt-1 block text-sm text-stone">{description}</span>
        {detail ? <span className="mt-1 block text-sm font-semibold text-ink tabular-nums">{detail}</span> : null}
      </span>
      <span
        aria-hidden
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gold/35 text-gold transition-colors duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-white"
      >
        <ChevronRight className="size-4" />
      </span>
      {external ? <span className="sr-only">(opens in a new tab)</span> : null}
    </a>
  );
}

/**
 * WhatsApp chat + phone call. Both use only the configured contact details
 * (src/config/site.ts / NEXT_PUBLIC_CONTACT_* env vars).
 */
export async function ContactActions({ className }: { className?: string }) {
  const contact = await getContactDetails();
  return (
    <ul className={cn("grid gap-4", className)}>
      <li>
        <ActionCard
          href={whatsappHref(contact)}
          external
          tile={<WhatsAppIcon className="size-8" />}
          tileClassName="bg-whatsapp text-white"
          title="Chat on WhatsApp"
          description="Get instant assistance from our team"
        />
      </li>
      <li>
        <ActionCard
          href={phoneHref(contact)}
          tile={<Phone className="size-6" fill="currentColor" strokeWidth={0} aria-hidden />}
          tileClassName={bronzeTile}
          title="Call Us"
          description="Speak directly with a sales consultant"
          detail={contact.phone}
        />
      </li>
    </ul>
  );
}

/**
 * Project location: name, city (placeholder until confirmed), visiting hours,
 * a working map link and a compact representative image.
 */
export async function ProjectLocationCard({ image, className }: { image: ImageAsset; className?: string }) {
  const contact = await getContactDetails();
  const location = { street: contact.street, city: contact.city, region: contact.region, mapUrl: contact.mapUrl };
  const { name } = siteConfig;
  return (
    <section aria-labelledby="project-location-title" className={cn(contactCard, "p-5 sm:p-6", className)}>
      <div className="flex items-start gap-4 sm:gap-5">
        <span className={cn("inline-flex size-14 shrink-0 items-center justify-center rounded-xl", bronzeTile)}>
          <MapPin className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="project-location-title" className="font-display text-[1.4rem] leading-tight text-ink sm:text-[1.6rem]">
            Project Location
          </h2>
          <address className="mt-1 text-sm leading-relaxed text-stone not-italic">
            <span className="block font-semibold text-ink">{name}</span>
            {location.street}, {location.city}, {location.region}
          </address>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-start gap-3 border-t border-line pt-5">
        <p className="flex items-center gap-2 text-sm text-stone">
          <Clock className="size-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
          {contact.hours}
        </p>
        <a
          href={location.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-gold/60 px-4 text-sm font-semibold text-ink transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-white sm:w-auto"
        >
          <MapPin className="size-4" aria-hidden />
          View on Map
          <ArrowUpRight className="size-4" aria-hidden />
          <span className="sr-only">(opens Google Maps in a new tab)</span>
        </a>
      </div>

      <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-xl">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1280px) 460px, (min-width: 1024px) 38vw, 100vw"
          className="object-cover"
        />
        <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-ivory backdrop-blur">
          Representative image
        </span>
      </div>
    </section>
  );
}
