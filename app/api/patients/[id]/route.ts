import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/http";
import { requireRole } from "@/lib/permissions/guards";
import { getPatientById } from "@/lib/patients/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    requireRole(user, ["doctor", "admin"]);

    const { id } = await context.params;
    const patient = await getPatientById(id);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    if (error instanceof Error && error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
