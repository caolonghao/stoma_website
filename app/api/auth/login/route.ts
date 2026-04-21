import { NextRequest, NextResponse } from "next/server";
import { createAuthCookie, issueAuthPayload } from "@/lib/auth/http";
import { loginUser } from "@/lib/auth/mock-store";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await loginUser(parsed.data);
    const payload = await issueAuthPayload(user);

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "set-cookie": createAuthCookie(payload.token)
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return NextResponse.json(
        { error: "账号或密码错误" },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
