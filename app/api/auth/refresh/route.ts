import { NextRequest, NextResponse } from "next/server";
import {
  createAuthCookie,
  getUserFromRequest,
  issueAuthPayload
} from "@/lib/auth/http";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await issueAuthPayload({
    id: user.sub,
    role: user.role,
    name: user.name
  });

  return NextResponse.json(payload, {
    headers: {
      "set-cookie": createAuthCookie(payload.token)
    }
  });
}
