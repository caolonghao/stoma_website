import type { AppRole, AuthTokenPayload } from "@/lib/auth/jwt";

export function requireRole(
  user: AuthTokenPayload | null,
  allowedRoles: AppRole[]
) {
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }

  return true;
}

export function requireSelfOrDoctor(
  user: AuthTokenPayload | null,
  ownerId: string
) {
  if (!user) {
    throw new Error("Not allowed");
  }

  if (user.role === "doctor" || user.role === "admin") {
    return true;
  }

  if (user.sub !== ownerId) {
    throw new Error("Not allowed");
  }

  return true;
}
