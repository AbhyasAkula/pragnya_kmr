/**
 * PLACEHOLDER IMAGERY (Unsplash). Replace with the client's renders/photos —
 * ideally self-hosted in /public/images — and update the paths here only.
 */
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2400&q=80`;

export const images = {
  heroDusk: unsplash("1600585154340-be6161a56a0c"),
  overviewPool: unsplash("1582268611958-ebfd161ef9cf"),
  overviewLiving: unsplash("1600566753086-00f18fb6b3ea"),
  villaMagnolia: unsplash("1600047509807-ba8f99d2cdde"),
  villaCypress: unsplash("1580587771525-78b9dba3b914"),
  villaBanyan: unsplash("1613490493576-7fde63acd811"),
  amenityPool: unsplash("1571003123894-1f0594d2b5d9"),
  galleryWhiteVilla: unsplash("1512917774080-9991f1c4c750"),
  galleryLounge: unsplash("1600210492486-724fe5c67fb0"),
  galleryBedroom: unsplash("1505693416388-ac5ce068fe85"),
  galleryCourtyard: unsplash("1416331108676-a22ccb276e35"),
  galleryTerrace: unsplash("1600596542815-ffad4c1539a9"),
  galleryVeranda: unsplash("1564013799919-ab600027ffc6"),
  siteVisit: unsplash("1602343168117-bb8ffe3e2e9f"),

  // Villa interiors / alternate exteriors (villa detail galleries)
  exteriorWhitePool: unsplash("1613977257363-707ba9348227"),
  exteriorTimberFacade: unsplash("1600566753190-17f0baa2a6c3"),
  exteriorDusk: unsplash("1600585154526-990dced4db0d"),
  livingArched: unsplash("1600210491892-03d54c0aaf87"),
  livingOpenPlan: unsplash("1600607687939-ce8a6c25118c"),
  stairPoolView: unsplash("1600573472550-8090b5e0745e"),
  bedroomMinimal: unsplash("1600607687644-c7171b42498f"),
  bedroomTimber: unsplash("1582719478250-c89cae4dc85b"),
  bathGlass: unsplash("1584622650111-993a426fbf0a"),
  bathStone: unsplash("1600566752355-35792bedcfea"),

  // Amenities page
  amenityResortDeck: unsplash("1566073771259-6a8506099945"),
  amenityBanquet: unsplash("1519167758481-83f550bb49b3"),
  amenityGym: unsplash("1540497077202-7c8a3999166f"),
  amenitySpa: unsplash("1544161515-4ab6ce6db874"),
  amenityTennis: unsplash("1595435934249-5df7ed86e1c0"),
  amenityGardenPath: unsplash("1585320806297-9794b3e4eeae"),
  amenityForestTrail: unsplash("1441974231531-c6227db76b6e"),

  // Construction progress (sample updates)
  constructionEarthworks: unsplash("1517089596392-fb9a9033e05b"),
  constructionSiteLayout: unsplash("1541888946425-d81bb19240f5"),
  constructionSlab: unsplash("1504307651254-35680f356dfd"),
  constructionColumns: unsplash("1531834685032-c34bf0d84c77"),
  constructionServices: unsplash("1621905251189-08b45d6a269e"),

  // About
  aboutPlanning: unsplash("1503387762-592deb58ef4e"),
} as const;
