export type NavItem = { label: string; href: string };

/**
 * Primary navigation (header, mobile menu and footer). Every entry is a real
 * page with a plain, predictable label.
 */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Villas", href: "/villas" },
  { label: "Master Plan", href: "/master-plan" },
  { label: "Amenities", href: "/amenities" },
  { label: "Gallery", href: "/gallery" },
  { label: "Progress", href: "/construction-progress" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Short list for the compact footer. */
export const footerNav: NavItem[] = [
  { label: "Villas", href: "/villas" },
  { label: "Master Plan", href: "/master-plan" },
  { label: "Progress", href: "/construction-progress" },
  { label: "Contact", href: "/contact" },
];

/** In-page "Book a Site Visit" buttons (not in the navbar) open the contact page's visit form. */
export const primaryCta: NavItem = { label: "Book a Site Visit", href: "/contact?type=visit" };

/** True when `href` is the current page (query strings ignored; anchors never count). */
export function isCurrentPath(href: string, pathname: string) {
  if (href.includes("#")) return false;
  const path = href.split("?")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}
