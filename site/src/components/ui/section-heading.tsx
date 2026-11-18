import { cn } from "@/lib/utils";
import type { SectionCopy } from "@/types/content";

type SectionHeadingProps = SectionCopy & {
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  id?: string;
  /** Allows programmatic focus (e.g. after a "Book a Site Visit" jump). */
  focusable?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "left",
  tone = "light",
  className,
  id,
  focusable = false,
}: SectionHeadingProps) {
  const onDark = tone === "dark";
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p
        className={cn(
          "eyebrow flex items-center gap-4",
          align === "center" && "justify-center",
          onDark ? "text-gold-light" : "text-gold",
        )}
      >
        <span aria-hidden className="h-px w-10 bg-current opacity-60" />
        {eyebrow}
      </p>
      <h2
        id={id}
        tabIndex={focusable ? -1 : undefined}
        className={cn(
          "mt-5 text-4xl sm:text-5xl lg:text-[3.5rem]",
          onDark ? "text-ivory" : "text-ink",
        )}
      >
        {title}
        {accent ? (
          <>
            {" "}
            <em className={onDark ? "text-gold-light" : "text-gold"}>{accent}</em>
          </>
        ) : null}
      </h2>
      {description ? (
        <p className={cn("mt-6 text-base sm:text-lg", onDark ? "text-mist" : "text-stone")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
