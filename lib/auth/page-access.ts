import type { AuthTokenPayload } from "@/lib/auth/jwt";

export function getHomeDestination(user: AuthTokenPayload | null) {
  if (!user) {
    return null;
  }

  return user.role === "doctor" ? "/doctor/patients" : "/patient/dashboard";
}

export function canAccessPortal(
  user: AuthTokenPayload | null,
  portal: "doctor" | "patient"
) {
  return user ? user.role === portal : false;
}
