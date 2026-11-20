/** Result returned by every admin Server Action (rendered inline by ActionForm). */
export type ActionResult = {
  ok: boolean;
  message?: string;
  /** Field path → message, e.g. { "gallery.2.caption": "Required" }. */
  errors?: Record<string, string>;
  /** One-time value to show after success (e.g. an invite link). */
  secret?: string;
} | null;

export const ok = (message: string, extra: Partial<NonNullable<ActionResult>> = {}): ActionResult => ({ ok: true, message, ...extra });
export const fail = (message: string, errors?: Record<string, string>): ActionResult => ({ ok: false, message, errors });
