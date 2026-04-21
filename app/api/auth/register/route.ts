import { NextRequest, NextResponse } from "next/server";
import { createAuthCookie, issueAuthPayload } from "@/lib/auth/http";
import { registerPatient } from "@/lib/auth/mock-store";
import { createOrLinkPatientProfileForUser } from "@/lib/patients/service";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await registerPatient(parsed.data);
    await createOrLinkPatientProfileForUser({
      userId: user.id,
      name: user.name,
      phone: user.phone ?? parsed.data.phone
    });
    const payload = await issueAuthPayload(user);

    return NextResponse.json(payload, {
      status: 201,
      headers: {
        "set-cookie": createAuthCookie(payload.token)
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PHONE_EXISTS") {
      return NextResponse.json(
        { error: "该手机号已注册" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
