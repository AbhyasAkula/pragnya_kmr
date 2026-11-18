import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { siteConfig } from "@/config/site";
import { emailHref, phoneHref, whatsappHref } from "@/lib/contact";
import { cn } from "@/lib/utils";

/**
 * The two primary sales actions — WhatsApp chat and a phone call — built
 * only from the configured contact numbers (src/config/site.ts / env).
 */
export function ContactActions({ className }: { className?: string }) {
  const { contact } = siteConfig;
  const actions = [
    {
      id: "whatsapp",
      title: "WhatsApp Chat",
      detail: "Brochures, prices and directions — answered quickly.",
      cta: "Start a chat",
      href: whatsappHref(),
      external: true,
      icon: <WhatsAppIcon className="size-6" />,
      dark: true,
    },
    {
      id: "call",
      title: "Call Now",
      detail: contact.phone,
      cta: "Call our sales team",
      href: phoneHref,
      external: false,
      icon: <Phone className="size-6" strokeWidth={1.5} aria-hidden />,
      dark: false,
    },
  ];

  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 sm:gap-6", className)}>
      {actions.map((a) => (
        <li key={a.id}>
          <a
            href={a.href}
            {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={cn(
              "group flex h-full items-center gap-5 rounded-[1.5rem] p-6 shadow-[0_30px_60px_-40px_rgba(28,25,23,0.55)] transition-[background-color,box-shadow,transform] duration-300 ease-calm hover:-translate-y-0.5 sm:p-8",
              a.dark ? "bg-ink text-ivory hover:bg-ink-soft" : "border border-line bg-white text-ink",
            )}
          >
            <span
              className={cn(
                "inline-flex size-14 shrink-0 items-center justify-center rounded-full",
                a.dark ? "bg-gold-light text-ink" : "bg-ink text-gold-light",
              )}
            >
              {a.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.75rem] leading-tight sm:text-3xl">{a.title}</span>
              <span className={cn("mt-1 block text-sm break-words tabular-nums", a.dark ? "text-mist" : "text-stone")}>
                {a.detail}
              </span>
              <span
                className={cn(
                  "mt-3 inline-flex items-center gap-1.5 text-sm font-semibold",
                  a.dark ? "text-gold-light" : "text-gold",
                )}
              >
                {a.cta}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                {a.external ? <span className="sr-only">(opens in a new tab)</span> : null}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Slim row of supporting details: site office, hours and email. */
export function OfficeDetails({ className }: { className?: string }) {
  const { contact, location } = siteConfig;
  const items = [
    {
      icon: MapPin,
      label: "Site office",
      text: `${location.street}, ${location.city}`,
      href: location.mapUrl,
      action: "Directions",
      external: true,
    },
    { icon: Clock, label: "Visiting hours", text: contact.hours },
    { icon: Mail, label: "Email", text: contact.email, href: emailHref, action: "Write to us", external: false },
  ];
  return (
    <ul className={cn("grid gap-6 md:grid-cols-3 md:gap-8", className)}>
      {items.map(({ icon: Icon, label, text, href, action, external }) => (
        <li key={label} className="flex gap-4">
          <Icon className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.14em] text-ink uppercase">{label}</p>
            <p className="mt-1 text-sm break-words text-stone">{text}</p>
            {href ? (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="mt-1 inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-gold hover:underline"
              >
                {action}
                <ArrowUpRight className="size-3.5" aria-hidden />
                {external ? <span className="sr-only">(opens in a new tab)</span> : null}
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
