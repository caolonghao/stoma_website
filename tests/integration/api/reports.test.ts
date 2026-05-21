import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { signJwt } from "@/lib/auth/jwt";
import { POST as uploadImage } from "@/app/api/images/route";
import { POST as createReport } from "@/app/api/reports/route";
import { GET as getReport } from "@/app/api/reports/[id]/route";
import { prisma } from "@/lib/db/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";

const sampleImagePath = path.resolve(
  process.cwd(),
  "tests/data/T001322119-2022-10-11_151502-2577696.jpg"
);

async function createSampleImageFile(name = "report-sample.jpg") {
  const buffer = await readFile(sampleImagePath);
  return new File([buffer], name, { type: "image/jpeg" });
}

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

async function patientJsonHeaders() {
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

async function patientUploadHeaders() {
  const token = await signJwt({
    sub: "patient-1",
    role: "patient",
    name: "Zhang San"
  });

  return {
    authorization: `Bearer ${token}`
  };
}

async function createPatientFollowup() {
  const form = new FormData();
  form.append("file", await createSampleImageFile("report-upload.jpg"));
  form.append("shotDate", "2026-04-27");
  form.append("positionType", "sitting_front");

    const response = await uploadImage(
      new NextRequest("http://localhost/api/images", {
        method: "POST",
        headers: await patientUploadHeaders(),
        body: form
      })
    );

  return response.json();
}

describe("reports api", () => {
  it("lets a doctor create a follow-up report", async () => {
    const uploadBody = await createPatientFollowup();

    const request = new NextRequest("http://localhost/api/reports", {
      method: "POST",
      headers: await doctorHeaders(),
      body: JSON.stringify({
        followupId: uploadBody.followup.id,
        hasComplication: true,
        complicationTypes: ["刺激性皮炎"],
        severityGrade: "Ib",
        doctorComment: "建议持续观察",
        status: "finalized"
      })
    });

    const response = await createReport(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.report.severityGrade).toBe("Ib");
    await expect(
      prisma.followUp.findUnique({
        where: { id: uploadBody.followup.id },
        select: { status: true }
      })
    ).resolves.toEqual({ status: "completed" });
  });

  it("lets a patient read the final report for their own follow-up", async () => {
    const uploadBody = await createPatientFollowup();

    await createReport(
      new NextRequest("http://localhost/api/reports", {
        method: "POST",
        headers: await doctorHeaders(),
        body: JSON.stringify({
          followupId: uploadBody.followup.id,
          hasComplication: false,
          complicationTypes: [],
          severityGrade: null,
          doctorComment: "当前无并发症",
          status: "finalized"
        })
      })
    );

    const response = await getReport(
      new NextRequest(`http://localhost/api/reports/${uploadBody.followup.id}`, {
        headers: await patientJsonHeaders()
      }),
      { params: Promise.resolve({ id: uploadBody.followup.id }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.report.followupId).toBe(uploadBody.followup.id);
  });

  it("blocks a patient from editing a report", async () => {
    const uploadBody = await createPatientFollowup();

    const response = await createReport(
      new NextRequest("http://localhost/api/reports", {
        method: "POST",
        headers: await patientJsonHeaders(),
        body: JSON.stringify({
          followupId: uploadBody.followup.id,
          hasComplication: true,
          complicationTypes: ["刺激性皮炎"],
          severityGrade: "Ia",
          doctorComment: "should not save",
          status: "draft"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/insufficient permissions/i);
  });
});
