import path from "node:path";
import { expect, test } from "@playwright/test";

const sampleImagePath = path.resolve(
  process.cwd(),
  "tests/data/T001322119-2022-10-11_151502-2577696.jpg"
);

test("patient upload -> doctor report -> patient reads result", async ({
  browser,
  request
}) => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const patientName = `自动化患者${uniqueSuffix}`;
  const patientPhone = `139${uniqueSuffix.padStart(8, "0")}`;
  const patientPassword = "Patient123!";
  const shotDate = "2026-04-28";

  const patientContext = await browser.newContext();
  const patientPage = await patientContext.newPage();

  const patientRegisterResponse = await request.post("http://127.0.0.1:3000/api/auth/register", {
    data: {
      name: patientName,
      phone: patientPhone,
      password: patientPassword
    }
  });
  const patientRegisterBody = await patientRegisterResponse.json();
  expect(patientRegisterResponse.status()).toBe(201);

  await patientContext.addCookies([
    {
      name: "stoma_atlas_token",
      value: patientRegisterBody.token,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: false,
      sameSite: "Lax"
    }
  ]);
  await patientPage.goto("/register");
  await patientPage.evaluate((token) => {
    window.localStorage.setItem("stoma_atlas_token", token);
  }, patientRegisterBody.token);
  await patientPage.goto("/patient/dashboard");

  await expect(patientPage).toHaveURL(/\/patient\/dashboard/);
  await expect(patientPage.getByRole("heading", { name: "我的随访" })).toBeVisible();
  await expect(
    patientPage.getByRole("heading", { name: "影像上传与随访归档", level: 2 })
  ).toBeVisible();
  await patientPage.getByLabel("拍摄日期").fill(shotDate);
  await patientPage.getByLabel("影像文件").setInputFiles(sampleImagePath);
  await patientPage.getByRole("button", { name: "上传并归档" }).click();

  await expect(
    patientPage.getByText(`已上传 T001322119-2022-10-11_151502-2577696.jpg`)
  ).toBeVisible();
  await expect(
    patientPage.locator(".timeline-card").filter({ hasText: shotDate }).first()
  ).toBeVisible();

  const doctorContext = await browser.newContext();
  const doctorPage = await doctorContext.newPage();

  const doctorLoginResponse = await request.post("http://127.0.0.1:3000/api/auth/login", {
    data: {
      account: "doctor",
      password: "Doctor123!"
    }
  });
  const doctorLoginBody = await doctorLoginResponse.json();
  expect(doctorLoginResponse.status()).toBe(200);

  await doctorContext.addCookies([
    {
      name: "stoma_atlas_token",
      value: doctorLoginBody.token,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: false,
      sameSite: "Lax"
    }
  ]);
  await doctorPage.goto("/login");
  await doctorPage.evaluate((token) => {
    window.localStorage.setItem("stoma_atlas_token", token);
  }, doctorLoginBody.token);
  await doctorPage.goto("/doctor/patients");

  await expect(doctorPage).toHaveURL(/\/doctor\/patients/);
  await expect(
    doctorPage.getByRole("heading", { name: "患者检索与总览" })
  ).toBeVisible();
  await doctorPage.locator("#name").fill(patientName);
  await doctorPage.getByRole("button", { name: "搜索患者" }).click();

  const patientCard = doctorPage.locator(".patient-card").filter({
    hasText: patientName
  });
  await expect(patientCard).toBeVisible();
  const recentFollowupLink = patientCard.getByRole("link", { name: "最近随访" });
  if (!(await recentFollowupLink.isVisible())) {
    await patientCard.getByRole("button", { name: /档案/ }).click();
  }
  await recentFollowupLink.click();

  await expect(doctorPage).toHaveURL(/\/doctor\/followups\//);
  await expect(
    doctorPage.getByRole("heading", { name: "影像复核与人工判读" })
  ).toBeVisible();
  await expect(doctorPage.getByText("AI 已完成")).toBeVisible();

  const doctorToken = await doctorPage.evaluate(() =>
    window.localStorage.getItem("stoma_atlas_token")
  );
  expect(doctorToken).toBeTruthy();

  const followupUrl = doctorPage.url();
  const followupId = followupUrl.split("/").pop();
  expect(followupId).toBeTruthy();

  const reportResponse = await request.post("http://127.0.0.1:3000/api/reports", {
    headers: {
      authorization: `Bearer ${doctorToken}`,
      "content-type": "application/json"
    },
    data: {
      followupId,
      hasComplication: false,
      complicationTypes: [],
      severityGrade: null,
      doctorComment: "自动化验证：当前无并发症。",
      status: "finalized"
    }
  });

  expect(reportResponse.status()).toBe(201);

  await patientPage.reload();
  await patientPage.getByRole("link", { name: "查看本次随访" }).first().click();
  await expect(patientPage).toHaveURL(/\/patient\/followups\//);
  await expect(
    patientPage.getByRole("heading", { name: "随访影像与医生结论" })
  ).toBeVisible();
  await expect(patientPage.getByRole("heading", { name: "正常" })).toBeVisible();
  await expect(patientPage.getByText("自动化验证：当前无并发症。")).toBeVisible();

  await patientContext.close();
  await doctorContext.close();
});
