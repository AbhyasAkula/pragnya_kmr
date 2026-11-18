import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { SocialIcon } from "@/components/ui/social-icons";
import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function Footer() {
  const { contact, location } = siteConfig;

  return (
    <footer className="bg-ink text-mist" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container-site pt-20 pb-10">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo tone="dark" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed">
              {siteConfig.name} by {siteConfig.developer}. {siteConfig.summary}
            </p>
            <ul className="mt-8 flex gap-3" aria-label="Social media">
              {siteConfig.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-mist transition-colors duration-300 hover:border-gold-light hover:text-gold-light"
                  >
                    <SocialIcon name={s.icon} className="size-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2 lg:col-start-6">
            <p className="eyebrow text-gold-light">Explore</p>
            <ul className="mt-6 space-y-3 text-sm">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-ivory">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4 lg:col-start-9">
            <p className="eyebrow text-gold-light">Visit & contact</p>
            <address className="mt-6 space-y-4 text-sm not-italic">
              <a href={location.mapUrl} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-ivory">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-light" aria-hidden />
                <span>
                  {location.street}, {location.city}, {location.region} {location.postalCode}
                </span>
              </a>
              <a href={contact.phoneHref} className="flex items-center gap-3 hover:text-ivory">
                <Phone className="size-4 shrink-0 text-gold-light" aria-hidden />
                {contact.phone}
              </a>
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 hover:text-ivory">
                <Mail className="size-4 shrink-0 text-gold-light" aria-hidden />
                {contact.email}
              </a>
            </address>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-xs leading-relaxed text-mist/80">
          <p>
            RERA Reg. No. {siteConfig.rera}. Images are artistic impressions and indicative only.
            Specifications, prices and availability are subject to change without notice. This
            website does not constitute an offer or contract.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <p>
              © {siteConfig.copyrightYear} {siteConfig.developer}. All rights reserved.
            </p>
            <p>{contact.hours}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
