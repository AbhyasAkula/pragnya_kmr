import type { Metadata } from "next";
import { VillaEditor } from "@/components/admin/editors";
import { AccessDenied, PageHeader } from "@/components/admin/ui";
import { can } from "@/lib/admin/permissions";
import { requireAdminPage } from "@/lib/admin/session";
import { saveVilla } from "../actions";

export const metadata: Metadata = { title: "New villa" };

const blank = {
  name: "",
  slug: "",
  configuration: "",
  availability: "AVAILABLE",
  summary: "",
  startingPrice: null,
  unitCount: null,
  builtUpArea: null,
  plotArea: null,
  floors: 2,
  bedrooms: null,
  bathrooms: null,
  carParks: null,
  description: [""],
  highlights: [],
  image: undefined,
  gallery: [],
  floorPlans: [],
};

export default async function NewVillaPage() {
  const user = await requireAdminPage();
  if (!can(user, "VILLAS")) return <AccessDenied feature="villas" />;
  return (
    <>
      <PageHeader back={{ href: "/admin/villas", label: "Villas" }} title="New villa" description="Saved as a draft. Publish it from the villa page when it's ready." />
      <VillaEditor action={saveVilla} initial={blank} submitLabel="Create draft" />
    </>
  );
}
