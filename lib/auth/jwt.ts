import { SignJWT, jwtVerify } from "jose";

export type AppRole = "admin" | "doctor" | "patient";

export type AuthTokenPayload = {
  sub: string;
  role: AppRole;
  name: string;
};

const encoder = new TextEncoder();

function getJwtSecret() {
  return encoder.encode(process.env.JWT_SECRET ?? "test-jwt-secret");
}

export async function signJwt(payload: AuthTokenPayload) {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyJwt(token: string): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());

  if (
    typeof payload.sub !== "string" ||
    typeof payload.role !== "string" ||
    typeof payload.name !== "string"
  ) {
    throw new Error("Invalid JWT payload");
  }

  return {
    sub: payload.sub,
    role: payload.role as AppRole,
    name: payload.name
  };
}
