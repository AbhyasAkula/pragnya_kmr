"use server";

import { siteConfig } from "@/config/site";
import { getEnquiryVillaOptions } from "@/lib/data";
import { todayInTimeZone } from "@/lib/dates";
import {
  siteVisitFields,
  validateSiteVisit,
  type SiteVisitField,
  type SiteVisitState,
} from "@/lib/validation/site-visit";

export async function requestSiteVisit(
  _prev: SiteVisitState,
  formData: FormData,
): Promise<SiteVisitState> {
  const demo = !siteConfig.features.leadStorageConnected;

  // Honeypot: real users never see or fill this field. Answer as if accepted.
  if (String(formData.get("company") ?? "").length > 0) {
    return { status: "success", demo, message: successMessage(demo) };
  }

  const values = Object.fromEntries(
    siteVisitFields.map((f) => [f, String(formData.get(f) ?? "")]),
  ) as Record<SiteVisitField, string>;

  const result = validateSiteVisit(values, {
    today: todayInTimeZone(siteConfig.timeZone),
    villaOptions: await getEnquiryVillaOptions(),
  });

  if ("errors" in result) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: result.errors,
      values,
    };
  }

  if (demo) {
    // DEMO MODE: input was validated and is now discarded. Nothing is stored,
    // logged or sent. See `siteConfig.features.leadStorageConnected`.
    return { status: "success", demo, message: successMessage(demo) };
  }

  // TODO(backend): persist `result.data` to the leads store / CRM, notify the
  // sales team, and add rate limiting + bot protection before setting
  // `leadStorageConnected` to true. This is the single integration point
  // the admin dashboard will read from.
  return { status: "success", demo, message: successMessage(demo, result.data.name) };
}

function successMessage(demo: boolean, name?: string) {
  if (demo) {
    return `This form is a demo and your details were not sent or stored. To arrange a visit, please call ${siteConfig.contact.phone} or message us on WhatsApp.`;
  }
  const firstName = name?.split(" ")[0];
  return `Thank you${firstName ? `, ${firstName}` : ""}. A relationship manager will call you within one working day to confirm your visit.`;
}
