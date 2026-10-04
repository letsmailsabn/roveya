import { AppError } from "@/lib/errors";

export type StaffRole = "CEO" | "ADMIN";

export function assertStaff(role: string | null | undefined): StaffRole {
  if (role === "CEO" || role === "ADMIN") return role;
  throw new AppError("Unauthorized", 401);
}

export function assertCeo(role: string | null | undefined) {
  if (role !== "CEO") throw new AppError("Forbidden", 403);
  return "CEO" as const;
}

export function assertCanConfirmCash(role: string | null | undefined) {
  return assertStaff(role);
}
