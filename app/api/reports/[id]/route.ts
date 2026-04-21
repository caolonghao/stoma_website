import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/http";
import { getFollowUpById } from "@/lib/followups/service";
import { getReportByFollowupId } from "@/lib/reports/service";
import { getPatientByUserId } from "@/lib/patients/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const followup = await getFollowUpById(id);

  if (!followup) {
    return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
  }

  if (user.role === "patient") {
    const patient = await getPatientByUserId(user.sub);
    if (!patient || patient.id !== followup.patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const report = await getReportByFollowupId(id);

  return NextResponse.json({ report });
}
