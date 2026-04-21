import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { signJwt } from "@/lib/auth/jwt";
import { POST as uploadImage } from "@/app/api/images/route";
import { GET as listFollowups } from "@/app/api/followups/route";

const sampleImagePath = path.resolve(
  process.cwd(),
  "tests/data/T001322119-2022-10-11_151502-2577696.jpg"
);

async function createSampleImageFile(name = "sample.jpg") {
  const buffer = await readFile(sampleImagePath);
  return new File([buffer], name, { type: "image/jpeg" });
}

async function patientHeaders() {
  const token = await signJwt({
    sub: "patient-1",
    role: "patient",
    name: "Zhang San"
  });

  return {
    authorization: `Bearer ${token}`
  };
}

describe("images and followups api", () => {
  it("uploads an image and creates a follow-up for the patient", async () => {
    const form = new FormData();
    form.append("file", await createSampleImageFile("stoma-front.jpg"));
    form.append("shotDate", "2026-04-21");
    form.append("positionType", "sitting_front");

    const request = new NextRequest("http://localhost/api/images", {
      method: "POST",
      headers: await patientHeaders(),
      body: form
    });

    const response = await uploadImage(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.image.positionType).toBe("sitting_front");
    expect(body.followup.followupDate).toBe("2026-04-21");
  });

  it("groups same-day uploads into the same follow-up", async () => {
    const formA = new FormData();
    formA.append("file", await createSampleImageFile("a.jpg"));
    formA.append("shotDate", "2026-04-22");
    formA.append("positionType", "sitting_front");

    const formB = new FormData();
    formB.append("file", await createSampleImageFile("b.jpg"));
    formB.append("shotDate", "2026-04-22");
    formB.append("positionType", "sitting_side");

    const first = await uploadImage(
      new NextRequest("http://localhost/api/images", {
        method: "POST",
        headers: await patientHeaders(),
        body: formA
      })
    );
    const second = await uploadImage(
      new NextRequest("http://localhost/api/images", {
        method: "POST",
        headers: await patientHeaders(),
        body: formB
      })
    );

    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(firstBody.followup.id).toBe(secondBody.followup.id);
  });

  it("returns the current patient's follow-up list", async () => {
    const request = new NextRequest("http://localhost/api/followups", {
      headers: await patientHeaders()
    });

    const response = await listFollowups(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.followups)).toBe(true);
  });
});
