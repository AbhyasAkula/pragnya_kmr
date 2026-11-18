import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { SocialIcon } from "@/components/ui/social-icons";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { footerNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { whatsappHref } from "@/lib/contact";

/**
 * Compact footer: brand + essential contact details on one row, then a thin
 * bar with minimal navigation, copyright and legal information.
 */
export function Footer() {
  const { contact, location } = siteConfig;

  const contactItems: { icon: ReactNode; label: string; href: string; external?: boolean }[] = [
    { icon: <Phone className="size-4" aria-hidden />, label: contact.phone, href: contact.phoneHref },
    { icon: <WhatsAppIcon className="size-4" />, label: "WhatsApp chat", href: whatsappHref(), external: true },
    { icon: <Mail className="size-4" aria-hidden />, label: contact.email, href: `mailto:${contact.email}` },
    { icon: <MapPin className="size-4" aria-hidden />, label: `${location.city}, ${location.region}`, href: location.mapUrl, external: true },
  ];

  return (
    <footer className="bg-ink text-mist" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container-site">
        {/* Brand + contact */}
        <div className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between md:gap-12 md:py-14">
          <div className="max-w-sm">
            <Logo tone="dark" />
            <p className="mt-4 text-sm leading-relaxed">
              {siteConfig.tagline} by {siteConfig.developer}.
            </p>
            <ul className="mt-5 flex gap-2" aria-label="Social media">
              {siteConfig.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} (opens in a new tab)`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-mist transition-colors duration-300 hover:border-gold-light hover:text-gold-light"
                  >
                    <SocialIcon name={s.icon} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <address className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm not-italic sm:gap-x-10 sm:gap-y-3">
            {contactItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex min-h-10 min-w-0 items-center gap-2.5 break-words transition-colors hover:text-ivory sm:gap-3"
              >
                <span className="text-gold-light">{item.icon}</span>
                {item.label}
                {item.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
              </a>
            ))}
          </address>
        </div>

        {/* Minimal navigation + legal */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs md:flex-row md:items-center md:justify-between">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-6 items-center transition-colors hover:text-ivory">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-mist/80">
            <span>
              © {siteConfig.copyrightYear} {siteConfig.developer}
            </span>
            <span>RERA Reg. No. {siteConfig.rera}</span>
          </div>
        </div>

        {/* Legal disclaimer — kept visible, as is customary for property marketing */}
        <p className="pb-8 text-xs leading-relaxed text-mist/70">
          Images are artistic impressions and indicative only. Specifications, prices and availability are subject to
          change without notice. This website does not constitute an offer or contract.
        </p>
      </div>
    </footer>
  );
}
