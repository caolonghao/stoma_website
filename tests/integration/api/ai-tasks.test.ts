import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { signJwt } from "@/lib/auth/jwt";
import { POST as retryTask } from "@/app/api/ai/tasks/[id]/retry/route";
import { GET as getTask } from "@/app/api/ai/tasks/[id]/route";
import { POST as uploadImage } from "@/app/api/images/route";
import { readFile } from "node:fs/promises";
import path from "node:path";

const sampleImagePath = path.resolve(
  process.cwd(),
  "tests/data/T001322119-2022-10-11_151502-2577696.jpg"
);

async function createSampleImageFile(name = "sample.jpg") {
  const buffer = await readFile(sampleImagePath);
  return new File([buffer], name, { type: "image/jpeg" });
}

async function doctorHeaders() {
  const token = await signJwt({
    sub: "doctor-1",
    role: "doctor",
    name: "Dr. Lin"
  });

  return { authorization: `Bearer ${token}` };
}

async function patientHeaders() {
  const token = await signJwt({
    sub: "patient-1",
    role: "patient",
    name: "Zhang San"
  });

  return { authorization: `Bearer ${token}` };
}

describe("ai task api", () => {
  it("auto-enqueues an ai task after image upload", async () => {
    const form = new FormData();
    form.append("file", await createSampleImageFile("ai-auto.jpg"));
    form.append("shotDate", "2026-04-23");
    form.append("positionType", "sitting_front");

    const uploadResponse = await uploadImage(
      new NextRequest("http://localhost/api/images", {
        method: "POST",
        headers: await patientHeaders(),
        body: form
      })
    );

    const uploadBody = await uploadResponse.json();

    expect(uploadResponse.status).toBe(201);
    expect(uploadBody.aiTask.status).toBe("queued");
  });

  it("lets a doctor retry ai for an existing task", async () => {
    const form = new FormData();
    form.append("file", await createSampleImageFile("ai-retry.jpg"));
    form.append("shotDate", "2026-04-24");
    form.append("positionType", "sitting_front");

    const uploadResponse = await uploadImage(
      new NextRequest("http://localhost/api/images", {
        method: "POST",
        headers: await patientHeaders(),
        body: form
      })
    );
    const uploadBody = await uploadResponse.json();

    const retryResponse = await retryTask(
      new NextRequest(
        `http://localhost/api/ai/tasks/${uploadBody.aiTask.id}/retry`,
        {
          method: "POST",
          headers: await doctorHeaders()
        }
      ),
      { params: Promise.resolve({ id: uploadBody.aiTask.id }) }
    );
    const retryBody = await retryResponse.json();

    expect(retryResponse.status).toBe(201);
    expect(retryBody.aiTask.triggerSource).toBe("manual");
  });

  it("blocks a patient from retrying ai", async () => {
    const form = new FormData();
    form.append("file", await createSampleImageFile("ai-denied.jpg"));
    form.append("shotDate", "2026-04-25");
    form.append("positionType", "sitting_front");

    const uploadResponse = await uploadImage(
      new NextRequest("http://localhost/api/images", {
        method: "POST",
        headers: await patientHeaders(),
        body: form
      })
    );
    const uploadBody = await uploadResponse.json();

    const retryResponse = await retryTask(
      new NextRequest(
        `http://localhost/api/ai/tasks/${uploadBody.aiTask.id}/retry`,
        {
          method: "POST",
          headers: await patientHeaders()
        }
      ),
      { params: Promise.resolve({ id: uploadBody.aiTask.id }) }
    );
    const retryBody = await retryResponse.json();

    expect(retryResponse.status).toBe(403);
    expect(retryBody.error).toMatch(/insufficient permissions/i);
  });

  it("returns ai task state by id", async () => {
    const form = new FormData();
    form.append("file", await createSampleImageFile("ai-state.jpg"));
    form.append("shotDate", "2026-04-26");
    form.append("positionType", "sitting_side");

    const uploadResponse = await uploadImage(
      new NextRequest("http://localhost/api/images", {
        method: "POST",
        headers: await patientHeaders(),
        body: form
      })
    );
    const uploadBody = await uploadResponse.json();

    const stateResponse = await getTask(
      new NextRequest(`http://localhost/api/ai/tasks/${uploadBody.aiTask.id}`, {
        headers: await doctorHeaders()
      }),
      { params: Promise.resolve({ id: uploadBody.aiTask.id }) }
    );
    const stateBody = await stateResponse.json();

    expect(stateResponse.status).toBe(200);
    expect(stateBody.aiTask.id).toBe(uploadBody.aiTask.id);
  });
});
