import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/http";
import { listFollowupsForPatient } from "@/lib/followups/service";
import { listImagesForFollowup } from "@/lib/images/service";
import { getPatientByUserId } from "@/lib/patients/service";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let patientId = request.nextUrl.searchParams.get("patientId") ?? undefined;

  if (user.role === "patient") {
    const patient = await getPatientByUserId(user.sub);
    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }
    patientId = patient.id;
  }

  if (!patientId) {
    return NextResponse.json({ error: "缺少患者标识" }, { status: 400 });
  }

  const followups = await listFollowupsForPatient(patientId);
  const hydrated = await Promise.all(
    followups.map(async (followup) => {
      const images = await listImagesForFollowup(followup.id);
      return {
        ...followup,
        imageCount: images.length,
        positions: images.map((image) => image.positionType)
      };
    })
  );

  return NextResponse.json({ followups: hydrated });
}
