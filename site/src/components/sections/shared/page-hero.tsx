import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import type { Crumb } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types/content";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  image: ImageAsset;
  breadcrumbs: Crumb[];
  /** Actions, facts strip or other content under the intro. */
  children?: ReactNode;
  /**
   * "default": tall image hero. "compact": shorter, leaves room for content
   * lifted onto its edge. "banner": short utility-page banner (e.g. Contact),
   * image to the right, single-line title, no visible breadcrumb trail.
   */
  size?: "default" | "compact" | "banner";
  /** Show the visible breadcrumb trail (structured data is emitted separately). */
  showBreadcrumbs?: boolean;
};

/** Same gentle cadence as the homepage hero: 0.15s lead-in, 0.1s between lines. */
const riseDelay = (step: number): CSSProperties => ({ animationDelay: `${0.15 + step * 0.1}s` });

/**
 * Interior-page hero in the homepage's visual language (full-bleed image,
 * ink scrims, gold eyebrow, serif headline with italic accent). Server
 * component; entrance uses CSS keyframes so content never waits for JS.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  description,
  image,
  breadcrumbs,
  children,
  size = "default",
  showBreadcrumbs = size !== "banner",
}: PageHeroProps) {
  const compact = size === "compact";
  const banner = size === "banner";
  return (
    <section
      aria-labelledby="page-title"
      className={cn(
        "relative isolate flex flex-col overflow-hidden bg-ink text-white",
        banner
          ? "min-h-[22rem] sm:min-h-[23rem] lg:min-h-[24rem]"
          : compact
            ? "min-h-[60svh] lg:min-h-[52svh]"
            : "min-h-[78svh] lg:min-h-[72svh]",
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
        className={cn("-z-20 object-cover", banner && "object-[72%_center]")}
      />
      {banner ? (
        // Banner: solid charcoal on the left for the copy, image revealed on the right.
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/25 sm:via-ink/75" />
      ) : (
        <>
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/75 via-ink/35 to-ink/90" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />
        </>
      )}

      {/* Compact heroes leave room at the bottom for content lifted onto the hero edge. */}
      <div
        className={cn(
          "container-site flex flex-1 flex-col",
          banner ? "justify-center pt-24 pb-10 sm:pb-12 lg:pt-28" : "justify-end pt-28 lg:pt-32",
          compact ? "pb-20 sm:pb-28" : !banner && "pb-12 sm:pb-16",
        )}
      >
        {showBreadcrumbs ? <Breadcrumbs items={breadcrumbs} className="animate-rise" /> : null}
        <div className={cn("max-w-3xl", showBreadcrumbs && "mt-8")}>
          <p className="eyebrow flex animate-rise items-center gap-4 text-gold-light" style={riseDelay(0)}>
            <span aria-hidden className="h-px w-10 bg-current" />
            {eyebrow}
          </p>
          <h1
            id="page-title"
            className={cn(
              "mt-6 leading-[1.04]",
              banner ? "max-w-2xl text-[2.4rem] sm:text-5xl lg:text-[3.6rem]" : "text-[2.6rem] sm:text-6xl lg:text-7xl",
            )}
          >
            <span className="block animate-rise" style={riseDelay(1)}>
              {title}
            </span>
            {accent ? (
              <span className="block animate-rise italic text-gold-light" style={riseDelay(2)}>
                {accent}
              </span>
            ) : null}
          </h1>
          {description ? (
            <p className={cn("max-w-xl animate-rise text-base text-white/85 sm:text-lg", banner ? "mt-5" : "mt-6")} style={riseDelay(3)}>
              {description}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="animate-rise" style={riseDelay(4)}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
