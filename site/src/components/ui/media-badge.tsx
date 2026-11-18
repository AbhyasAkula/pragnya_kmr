import { Camera, PenTool, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaSource } from "@/types/content";

const labels: Record<MediaSource, { short: string; long: string }> = {
  render: { short: "Render", long: "Render · artist's impression" },
  photo: { short: "Photo", long: "Photograph" },
};

/**
 * Tells visitors whether a visual is an architectural render or a real
 * photograph (and flags videos). Text + icon, never colour alone.
 */
export function MediaBadge({
  source,
  isVideo = false,
  long = false,
  className,
}: {
  source: MediaSource;
  isVideo?: boolean;
  long?: boolean;
  className?: string;
}) {
  const Icon = source === "render" ? PenTool : Camera;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-semibold tracking-[0.08em] text-ivory backdrop-blur",
        className,
      )}
    >
      {isVideo ? <Video className="size-3.5" aria-hidden /> : <Icon className="size-3.5" aria-hidden />}
      {isVideo ? `Video · ${labels[source].short}` : long ? labels[source].long : labels[source].short}
    </span>
  );
}
