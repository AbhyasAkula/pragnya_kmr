import { z } from "zod";
import { PERMISSIONS } from "@/lib/admin/permissions";

export const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254));

const COMMON = ["password", "123456", "qwerty", "letmein", "welcome", "admin", "aurelia", "iloveyou"];

/** 12+ characters; length beats complexity rules for real-world strength. */
export const newPassword = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(72, "Use at most 72 characters")
  .refine((p) => new Set(p).size >= 5, "Use a less repetitive password")
  .refine((p) => !COMMON.some((c) => p.toLowerCase().includes(c)), "Avoid common words like “password” or the project name");

export const staffInviteSchema = z.object({
  fullName: z.string().trim().min(1, "Required").max(80),
  email,
  role: z.enum(["OWNER", "STAFF"]),
  permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length),
});

export const staffUpdateSchema = z.object({
  fullName: z.string().trim().min(1, "Required").max(80),
  role: z.enum(["OWNER", "STAFF"]),
  permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length),
});
