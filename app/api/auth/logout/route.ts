import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/http";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "set-cookie": clearAuthCookie()
      }
    }
  );
}
