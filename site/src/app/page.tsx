import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Amenities } from "@/components/sections/home/amenities";
import { GalleryPreview } from "@/components/sections/home/gallery-preview";
import { Hero } from "@/components/sections/home/hero";
import { Overview } from "@/components/sections/home/overview";
import { SiteVisitCta } from "@/components/sections/home/site-visit-cta";
import { VillaShowcase } from "@/components/sections/home/villa-showcase";
import {
  getAmenities,
  getContactDetails,
  getGalleryPreview,
  getHeroContent,
  getProjectOverview,
  getSeoDescription,
  getSiteVisitContent,
  getVillaSection,
} from "@/lib/data";
import { homeJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({ path: "/", description: await getSeoDescription() });
}

export default async function HomePage() {
  const [hero, overview, villaSection, amenities, gallery, siteVisit, description, contact] =
    await Promise.all([
      getHeroContent(),
      getProjectOverview(),
      getVillaSection(),
      getAmenities(),
      getGalleryPreview(),
      getSiteVisitContent(),
      getSeoDescription(),
      getContactDetails(),
    ]);

  const jsonLd = homeJsonLd(villaSection.villas, hero.image.src, description, contact);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar contact={contact} />
      <main id="main">
        <Hero content={hero} />
        <Overview content={overview} />
        <VillaShowcase {...villaSection} />
        <Amenities {...amenities} />
        <GalleryPreview {...gallery} />
        <SiteVisitCta {...siteVisit} />
      </main>
      <Footer />
    </>
  );
}
