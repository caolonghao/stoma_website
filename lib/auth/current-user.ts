import { cookies } from "next/headers";
import { verifyJwt, type AuthTokenPayload } from "@/lib/auth/jwt";

const AUTH_COOKIE = "stoma_atlas_token";

export async function getCurrentUser(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyJwt(token);
  } catch {
    return null;
  }
}

export { AUTH_COOKIE };
