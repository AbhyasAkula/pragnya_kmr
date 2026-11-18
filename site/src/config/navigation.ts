export type NavItem = { label: string; href: string };

/** Primary navigation (header, mobile menu and footer). */
export const mainNav: NavItem[] = [
  { label: "Villas", href: "/villas" },
  { label: "Master Plan", href: "/master-plan" },
  { label: "Amenities", href: "/amenities" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Contact", href: "/#site-visit" },
];

export const primaryCta: NavItem = { label: "Book a Site Visit", href: "/#site-visit" };

/** True when `href` is the current page (anchor links never count as "current"). */
export function isCurrentPath(href: string, pathname: string) {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
