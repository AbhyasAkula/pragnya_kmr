import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/editors";
import { AccessDenied, LinkButton, PageHeader } from "@/components/admin/ui";
import { getContentForEdit } from "@/lib/admin/content-store";
import { contentBySlug, contentTitles } from "@/lib/admin/content-sections";
import { formatDateTime } from "@/lib/admin/format";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { saveContent } from "../actions";

export const metadata: Metadata = { title: "Edit content" };

export default async function ContentSectionPage({ params }: PageProps<"/admin/content/[section]">) {
  const user = await requireAdminPage();
  if (!can(user, "CONTENT")) return <AccessDenied feature="website content" />;
  const { section } = await params;
  const item = contentBySlug[section];
  if (!item) notFound();
  const { value, updatedAt, updatedBy } = await getContentForEdit(item.key);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/content", label: "Content" }}
        title={contentTitles[item.key]}
        description={updatedAt ? `Last saved ${formatDateTime(updatedAt)}${updatedBy ? ` by ${updatedBy}` : ""}.` : item.description}
        actions={
          <LinkButton href={item.publicPath} target="_blank" variant="secondary">
            View on website <ExternalLink className="size-4" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </LinkButton>
        }
      />
      <ContentEditor contentKey={item.key} action={saveContent} initial={value as Record<string, unknown>} />
    </>
  );
}
