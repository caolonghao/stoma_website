import { NextRequest, NextResponse } from "next/server";
import { signJwt, verifyJwt } from "@/lib/auth/jwt";

export async function issueAuthPayload(user: {
  id: string;
  role: "doctor" | "patient" | "admin";
  name: string;
}) {
  const token = await signJwt({
    sub: user.id,
    role: user.role,
    name: user.name
  });

  return {
    token,
    user: {
      id: user.id,
      role: user.role,
      name: user.name
    }
  };
}

export function createAuthCookie(token: string) {
  return `stoma_atlas_token=${token}; Path=/; HttpOnly; SameSite=Lax`;
}

export function clearAuthCookie() {
  return "stoma_atlas_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export async function createAuthResponse(user: {
  id: string;
  role: "doctor" | "patient" | "admin";
  name: string;
}) {
  const payload = await issueAuthPayload(user);

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "cache-control": "no-store"
    }
  });
}

export async function getUserFromRequest(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const cookieToken = request.cookies.get("stoma_atlas_token")?.value;

  if (auth?.startsWith("Bearer ")) {
    return verifyJwt(auth.replace("Bearer ", ""));
  }

  if (cookieToken) {
    return verifyJwt(cookieToken);
  }

  return null;
}
