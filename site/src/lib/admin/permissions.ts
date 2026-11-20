/**
 * Role-based access control, shared by navigation (UI) and the server-side
 * checks (the authority). OWNER has every permission plus staff management,
 * which is never grantable to STAFF — so a staff member cannot escalate.
 */
export const PERMISSIONS = ["BOOKINGS", "VILLAS", "GALLERY", "CONSTRUCTION", "CONTENT", "SETTINGS", "AUDIT_LOG"] as const;
export type Permission = (typeof PERMISSIONS)[number];
export type Role = "OWNER" | "STAFF";

export const PERMISSION_INFO: Record<Permission, { label: string; description: string }> = {
  BOOKINGS: { label: "Bookings", description: "View customer site-visit requests (names, phone numbers), update status, assign, add notes." },
  VILLAS: { label: "Villas", description: "Create, edit, publish and remove villa models, floor plans and specifications." },
  GALLERY: { label: "Gallery", description: "Upload, edit, order, publish and delete gallery images." },
  CONSTRUCTION: { label: "Construction progress", description: "Publish construction updates, photos and milestones." },
  CONTENT: { label: "Website content", description: "Edit homepage, amenities, master plan, project details and contact details." },
  SETTINGS: { label: "Settings", description: "Turn online bookings on or off; RERA number and privacy policy link." },
  AUDIT_LOG: { label: "Audit log", description: "View the record of admin actions." },
};

export type AdminIdentity = { role: Role; permissions: readonly Permission[] };

export function can(user: AdminIdentity, permission: Permission | "OWNER"): boolean {
  if (user.role === "OWNER") return true;
  if (permission === "OWNER") return false;
  return user.permissions.includes(permission);
}

/** Uploading images is needed by every content module. */
export const MEDIA_PERMISSIONS: Permission[] = ["VILLAS", "GALLERY", "CONSTRUCTION", "CONTENT"];

export function canUseMedia(user: AdminIdentity) {
  return MEDIA_PERMISSIONS.some((p) => can(user, p));
}
