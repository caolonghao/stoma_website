import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as createPatient } from "@/app/api/patients/route";
import { signJwt } from "@/lib/auth/jwt";

describe("prisma persistence", () => {
  it("persists a registered patient user and linked patient profile", async () => {
    const phone = `137${Date.now().toString().slice(-8)}`;
    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Prisma患者",
        phone,
        password: "StrongPass123"
      }),
      headers: {
        "content-type": "application/json"
      }
    });

    const response = await register(request);
    const body = await response.json();

    expect(response.status).toBe(201);

    const user = await prisma.user.findUnique({
      where: { id: body.user.id }
    });
    const patient = await prisma.patient.findUnique({
      where: { userId: body.user.id }
    });

    expect(user?.phone).toBe(phone);
    expect(patient?.phone).toBe(phone);
  });

  it("persists a doctor-created patient file", async () => {
    const token = await signJwt({
      sub: "doctor-1",
      role: "doctor",
      name: "Dr. Lin"
    });
    const medicalRecordNo = `MRN-PERSIST-${Date.now().toString().slice(-6)}`;

    const request = new NextRequest("http://localhost/api/patients", {
      method: "POST",
      body: JSON.stringify({
        name: "落库患者",
        gender: "female",
        birthDate: "1978-02-12",
        phone: `136${Date.now().toString().slice(-8)}`,
        stomaDate: "2026-04-18",
        stomaType: "colostomy",
        medicalRecordNo
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      }
    });

    const response = await createPatient(request);
    const body = await response.json();

    expect(response.status).toBe(201);

    const patient = await prisma.patient.findUnique({
      where: { id: body.patient.id }
    });

    expect(patient?.medicalRecordNo).toBe(medicalRecordNo);
  });
});
