import { expect, test, type APIRequestContext, type Browser } from "@playwright/test";

async function signInAs(
  request: APIRequestContext,
  browser: Browser,
  credentials: { account: string; password: string }
) {
  const response = await request.post("http://127.0.0.1:3000/api/auth/login", {
    data: credentials
  });
  const body = await response.json();

  expect(response.status()).toBe(200);

  const context = await browser.newContext();
  await context.addCookies([
    {
      name: "stoma_atlas_token",
      value: body.token,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: false,
      sameSite: "Lax"
    }
  ]);

  return context;
}

test("unauthenticated users stay on the home auth screen", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "肠造口随访管理平台" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "患者", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "医生", exact: true })).toBeVisible();
});

test("old auth routes redirect back to home", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/register");
  await expect(page).toHaveURL(/\/$/);
});

test("signed-in doctors visiting home are redirected to the doctor workspace", async ({
  browser,
  request
}) => {
  const context = await signInAs(request, browser, {
    account: "doctor",
    password: "Doctor123!"
  });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page).toHaveURL(/\/doctor\/patients$/);
  await context.close();
});

test("patients can register directly from the home auth card", async ({ page }) => {
  const uniqueSuffix = Date.now().toString().slice(-6);

  await page.goto("/");
  await page.getByRole("button", { name: "注册" }).click();
  await page.getByLabel("姓名").fill(`认证患者${uniqueSuffix}`);
  await page.getByLabel("手机号").fill(`139${uniqueSuffix.padStart(8, "0")}`);
  await page.getByLabel("密码").fill("Patient123!");
  await page.getByRole("button", { name: "创建账号" }).click();

  await expect(page).toHaveURL(/\/patient\/dashboard$/);
});

test("doctors can sign in directly from the home auth card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "医生" }).click();
  await page.getByLabel("医生账号").fill("doctor");
  await page.getByLabel("密码").fill("Doctor123!");
  await page.getByRole("button", { name: "进入医生工作台" }).click();

  await expect(page).toHaveURL(/\/doctor\/patients$/);
});

test("signed-out users cannot open protected routes", async ({ page }) => {
  await page.goto("/patient/dashboard");
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/doctor/patients");
  await expect(page).toHaveURL(/\/$/);
});

test("patients trying to open doctor routes return to their own workspace", async ({
  browser,
  request
}) => {
  const context = await signInAs(request, browser, {
    account: "13800000010",
    password: "Patient123!"
  });
  const page = await context.newPage();

  await page.goto("/doctor/patients");

  await expect(page).toHaveURL(/\/patient\/dashboard$/);
  await context.close();
});

test("doctors trying to open patient routes return to their own workspace", async ({
  browser,
  request
}) => {
  const context = await signInAs(request, browser, {
    account: "doctor",
    password: "Doctor123!"
  });
  const page = await context.newPage();

  await page.goto("/patient/dashboard");

  await expect(page).toHaveURL(/\/doctor\/patients$/);
  await context.close();
});
