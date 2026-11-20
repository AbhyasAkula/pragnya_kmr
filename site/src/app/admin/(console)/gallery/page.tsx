import { ArrowLeft, ArrowRight, Images, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GalleryUploader } from "@/components/admin/gallery-uploader";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { AccessDenied, Badge, btn, Card, CardHeader, EmptyState, LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { isPlaceholderImage, mediaPublicPrefix } from "@/lib/media";
import { getDb } from "@/lib/server/db";
import { cn } from "@/lib/utils";
import { addGalleryItems, moveGalleryItem } from "./actions";

export const metadata: Metadata = { title: "Gallery" };

const CATEGORIES = { VILLAS: "Villas", INTERIORS: "Interiors", AMENITIES: "Amenities", COMMUNITY: "Community" } as const;
type Category = keyof typeof CATEGORIES;

export default async function GalleryPage({ searchParams }: PageProps<"/admin/gallery">) {
  const user = await requireAdminPage();
  if (!can(user, "GALLERY")) return <AccessDenied feature="the gallery" />;
  const sp = await searchParams;
  const category = typeof sp.category === "string" && sp.category in CATEGORIES ? (sp.category as Category) : null;
  const status = sp.status === "DRAFT" || sp.status === "PUBLISHED" ? sp.status : null;

  const all = await getDb().galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, src: true, caption: true, category: true, source: true, status: true, featured: true, kind: true },
  });
  const items = all.filter((g) => (!category || g.category === category) && (!status || g.status === status));
  const placeholderCount = all.filter((g) => g.status === "PUBLISHED" && isPlaceholderImage(g.src)).length;
  const filterHref = (p: { category?: string | null; status?: string | null }) => {
    const q = new URLSearchParams();
    const c = p.category === undefined ? category : p.category;
    const s = p.status === undefined ? status : p.status;
    if (c) q.set("category", c);
    if (s) q.set("status", s);
    return `/admin/gallery${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Gallery"
        description="Images on /gallery. Starred images (in this order) appear in the homepage preview."
        actions={<LinkButton href="/admin/gallery/notice" variant="secondary">Page notice</LinkButton>}
      />
      {sp.deleted ? <Notice tone="success" className="mb-4">The item was deleted.</Notice> : null}
      {placeholderCount > 0 ? (
        <Notice tone="warning" className="mb-4">
          {placeholderCount} published image{placeholderCount === 1 ? " is a" : "s are"} stock placeholder{placeholderCount === 1 ? "" : "s"}. Replace them with the
          developer&apos;s own renders and photographs before launch.
        </Notice>
      ) : null}

      <Card className="mb-6">
        <CardHeader title="Upload images" description="New images are added at the end of the gallery." />
        {mediaPublicPrefix ? (
          <GalleryUploader addItems={addGalleryItems} />
        ) : (
          <p className="p-5 text-sm text-stone">Image storage isn&apos;t configured yet (Supabase keys missing).</p>
        )}
      </Card>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <FilterChip href={filterHref({ category: null })} active={!category}>
          All ({all.length})
        </FilterChip>
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <FilterChip key={c} href={filterHref({ category: c })} active={category === c}>
            {CATEGORIES[c]} ({all.filter((g) => g.category === c).length})
          </FilterChip>
        ))}
        <span className="mx-1 hidden w-px bg-line sm:block" aria-hidden />
        <FilterChip href={filterHref({ status: status === "DRAFT" ? null : "DRAFT" })} active={status === "DRAFT"}>
          Drafts only
        </FilterChip>
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={<Images className="size-8" aria-hidden />} title="No images here yet">
            Upload images above, or change the filter.
          </EmptyState>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((g) => {
            const index = all.findIndex((x) => x.id === g.id);
            return (
              <li key={g.id} className="overflow-hidden rounded-xl border border-line bg-panel shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                <Link href={`/admin/gallery/${g.id}`} className="group block">
                  <div className="relative aspect-[4/3] bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                    <img src={g.src} alt="" loading="lazy" className="h-full w-full object-cover transition-opacity group-hover:opacity-90" />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      <Badge tone={g.status === "PUBLISHED" ? "success" : "neutral"} className="shadow-sm">
                        {g.status === "PUBLISHED" ? "Published" : "Draft"}
                      </Badge>
                      {g.featured ? (
                        <Badge tone="gold" className="bg-white shadow-sm">
                          <Star className="size-3" aria-hidden /> Homepage
                        </Badge>
                      ) : null}
                      {isPlaceholderImage(g.src) ? <Badge tone="warning" className="shadow-sm">Placeholder</Badge> : null}
                    </div>
                  </div>
                  <div className="px-3 pt-2.5">
                    <p className="truncate font-semibold text-ink group-hover:underline">{g.caption}</p>
                    <p className="text-xs text-stone">
                      {CATEGORIES[g.category]} · {g.kind === "VIDEO" ? "Video" : g.source === "RENDER" ? "Render" : "Photo"}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center justify-between px-2 pt-1 pb-2">
                  <div className="flex">
                    <ActionForm action={moveGalleryItem} hideMessage>
                      <input type="hidden" name="id" value={g.id} />
                      <input type="hidden" name="dir" value="up" />
                      <SubmitButton variant="ghost" size="sm" disabled={index === 0} aria-label={`Move “${g.caption}” earlier`} pendingLabel="">
                        <ArrowLeft className="size-4" aria-hidden />
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={moveGalleryItem} hideMessage>
                      <input type="hidden" name="id" value={g.id} />
                      <input type="hidden" name="dir" value="down" />
                      <SubmitButton variant="ghost" size="sm" disabled={index === all.length - 1} aria-label={`Move “${g.caption}” later`} pendingLabel="">
                        <ArrowRight className="size-4" aria-hidden />
                      </SubmitButton>
                    </ActionForm>
                  </div>
                  <Link href={`/admin/gallery/${g.id}`} className={btn({ variant: "secondary", size: "sm" })}>
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium",
        active ? "border-ink bg-ink text-ivory" : "border-line bg-white text-ink hover:border-ink/40",
      )}
    >
      {children}
    </Link>
  );
}
