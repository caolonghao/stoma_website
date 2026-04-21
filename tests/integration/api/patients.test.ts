import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { signJwt } from "@/lib/auth/jwt";
import { GET, POST } from "@/app/api/patients/route";

async function doctorHeaders() {
  const token = await signJwt({
    sub: "doctor-1",
    role: "doctor",
    name: "Dr. Lin"
  });

  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

async function patientHeaders() {
  const token = await signJwt({
    sub: "patient-1",
    role: "patient",
    name: "Zhang San"
  });

  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };
}

describe("patients api", () => {
  it("lets a doctor create a patient file", async () => {
    const request = new NextRequest("http://localhost/api/patients", {
      method: "POST",
      headers: await doctorHeaders(),
      body: JSON.stringify({
        name: "李娟",
        gender: "female",
        birthDate: "1978-02-12",
        phone: "13800000009",
        stomaDate: "2026-04-18",
        stomaType: "colostomy",
        medicalRecordNo: "MRN-1009"
      })
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.patient.name).toBe("李娟");
    expect(body.patient.stomaType).toBe("colostomy");
  });

  it("lets a doctor search by combined fields", async () => {
    const createRequest = new NextRequest("http://localhost/api/patients", {
      method: "POST",
      headers: await doctorHeaders(),
      body: JSON.stringify({
        name: "王敏",
        gender: "female",
        birthDate: "1980-07-10",
        phone: "13800000010",
        stomaDate: "2026-04-20",
        stomaType: "colostomy",
        medicalRecordNo: "MRN-1010"
      })
    });
    await POST(createRequest);

    const searchRequest = new NextRequest(
      "http://localhost/api/patients?name=%E7%8E%8B%E6%95%8F&stomaType=colostomy&medicalRecordNo=MRN-1010",
      {
        headers: await doctorHeaders()
      }
    );

    const response = await GET(searchRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patients).toHaveLength(1);
    expect(body.patients[0].name).toBe("王敏");
  });

  it("blocks patients from listing all patient files", async () => {
    const request = new NextRequest("http://localhost/api/patients", {
      headers: await patientHeaders()
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/insufficient permissions/i);
  });
});
