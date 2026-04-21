import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/http";
import { requireRole } from "@/lib/permissions/guards";
import { createPatient, listPatients } from "@/lib/patients/service";
import {
  createPatientSchema,
  patientSearchSchema
} from "@/lib/validators/patient";

function forbiddenResponse(error: unknown) {
  if (error instanceof Error && error.message === "Insufficient permissions") {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    requireRole(user, ["doctor", "admin"]);

    const filters = patientSearchSchema.parse({
      name: request.nextUrl.searchParams.get("name") ?? undefined,
      gender: request.nextUrl.searchParams.get("gender") ?? undefined,
      birthDate: request.nextUrl.searchParams.get("birthDate") ?? undefined,
      phone: request.nextUrl.searchParams.get("phone") ?? undefined,
      stomaDate: request.nextUrl.searchParams.get("stomaDate") ?? undefined,
      stomaType: request.nextUrl.searchParams.get("stomaType") ?? undefined,
      medicalRecordNo:
        request.nextUrl.searchParams.get("medicalRecordNo") ?? undefined
    });

    const patients = await listPatients(filters);

    return NextResponse.json({ patients });
  } catch (error) {
    const forbidden = forbiddenResponse(error);
    if (forbidden) {
      return forbidden;
    }

    return NextResponse.json({ error: "Invalid patient query" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    requireRole(user, ["doctor", "admin"]);

    const parsed = createPatientSchema.parse(await request.json());
    const patient = await createPatient(parsed);

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    const forbidden = forbiddenResponse(error);
    if (forbidden) {
      return forbidden;
    }

    if (error instanceof Error && error.message === "PHONE_EXISTS") {
      return NextResponse.json({ error: "手机号已存在" }, { status: 409 });
    }

    if (error instanceof Error && error.message === "MRN_EXISTS") {
      return NextResponse.json({ error: "病历号已存在" }, { status: 409 });
    }

    return NextResponse.json({ error: "Invalid patient payload" }, { status: 400 });
  }
}
