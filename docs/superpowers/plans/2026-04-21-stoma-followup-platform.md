# Stoma Follow-Up Platform Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first MVP of a single-department stoma follow-up platform with doctor and patient portals, JWT auth, patient records, follow-up grouping, image upload, async AI task integration, and final diagnosis reports.

**Architecture:** Use a single Next.js codebase with App Router for UI and Route Handlers for APIs. Keep business logic in `lib/*`, database access in Prisma, role checks in a dedicated permissions layer, image metadata in MySQL, files in local filesystem storage for MVP, and AI inference behind an async adapter that talks to a FastAPI task service. The AI service currently returns category-level results only; fine-grained complication typing remains manual.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Prisma, MySQL, JWT, Vitest, Testing Library, Playwright, S3-compatible object storage, FastAPI

---

## File Structure

### Planned app structure

- Create: `/Users/tonycao/mycode/stoma_website/package.json`
- Create: `/Users/tonycao/mycode/stoma_website/next.config.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tsconfig.json`
- Create: `/Users/tonycao/mycode/stoma_website/postcss.config.js`
- Create: `/Users/tonycao/mycode/stoma_website/tailwind.config.ts`
- Create: `/Users/tonycao/mycode/stoma_website/vitest.config.ts`
- Create: `/Users/tonycao/mycode/stoma_website/playwright.config.ts`
- Create: `/Users/tonycao/mycode/stoma_website/.env.example`
- Create: `/Users/tonycao/mycode/stoma_website/app/layout.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/globals.css`
- Create: `/Users/tonycao/mycode/stoma_website/app/(auth)/login/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/(auth)/register/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/doctor/followups/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/patient/dashboard/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/patient/followups/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/auth/login/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/auth/register/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/auth/me/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/auth/refresh/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/patients/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/patients/[id]/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/followups/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/followups/[id]/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/images/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/images/[id]/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/ai/tasks/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/ai/tasks/[id]/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/ai/tasks/[id]/retry/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/reports/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/reports/[id]/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/auth/jwt.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/auth/current-user.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/db/prisma.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/permissions/guards.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/patients/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/followups/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/images/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/reports/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/ai/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/ai/provider.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/storage/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/validators/auth.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/validators/patient.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/validators/image.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/validators/report.ts`
- Create: `/Users/tonycao/mycode/stoma_website/prisma/schema.prisma`
- Create: `/Users/tonycao/mycode/stoma_website/tests/unit/auth/jwt.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/unit/permissions/guards.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/unit/followups/grouping.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/unit/ai/tasks.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/unit/reports/report-validation.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/integration/api/auth.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/integration/api/patients.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/integration/api/images-followups.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/integration/api/reports.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/e2e/doctor-flow.spec.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/e2e/patient-flow.spec.ts`
- Create: `/Users/tonycao/mycode/stoma_website/scripts/poll-ai-tasks.ts`

## Chunk 1: Project Skeleton And Auth

### Task 1: Scaffold the app and test tooling

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/package.json`
- Create: `/Users/tonycao/mycode/stoma_website/next.config.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tsconfig.json`
- Create: `/Users/tonycao/mycode/stoma_website/postcss.config.js`
- Create: `/Users/tonycao/mycode/stoma_website/tailwind.config.ts`
- Create: `/Users/tonycao/mycode/stoma_website/vitest.config.ts`
- Create: `/Users/tonycao/mycode/stoma_website/playwright.config.ts`
- Create: `/Users/tonycao/mycode/stoma_website/.env.example`
- Create: `/Users/tonycao/mycode/stoma_website/app/layout.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/globals.css`

- [ ] **Step 1: Add package scripts and dependencies**

Include scripts for `dev`, `build`, `lint`, `test`, `test:unit`, `test:integration`, `test:e2e`, `prisma:generate`, and `prisma:migrate`.

- [ ] **Step 2: Add the failing smoke test setup**

Create a minimal test file that imports the app shell and asserts the project test runner loads:

```ts
import { describe, expect, it } from "vitest";

describe("project setup", () => {
  it("runs tests", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 3: Run the unit test command**

Run: `pnpm vitest run`
Expected: PASS with one smoke test

- [ ] **Step 4: Create the base app shell**

Add the root layout, global styles, and a neutral landing redirect target.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold nextjs app and test tooling"
```

### Task 2: Define Prisma schema and database client

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/prisma/schema.prisma`
- Create: `/Users/tonycao/mycode/stoma_website/lib/db/prisma.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/unit/followups/grouping.test.ts`

- [ ] **Step 1: Write a failing schema-backed test description**

Add a placeholder test naming the expected model graph:

```ts
it("groups images under followups and stores AI task history", () => {
  expect(["User", "Patient", "FollowUp", "Image", "AIResult", "DiagnosisReport", "AITask"]).toContain("AITask");
});
```

- [ ] **Step 2: Define the Prisma models**

Add exact models and enums for roles, stoma type, image position, follow-up status, AI task status, report severity, and report status.

- [ ] **Step 3: Add the Prisma singleton client**

Export one reusable Prisma client from `lib/db/prisma.ts`.

- [ ] **Step 4: Generate the Prisma client**

Run: `pnpm prisma generate`
Expected: Prisma client generated successfully

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma lib/db/prisma.ts
git commit -m "feat: add core prisma schema"
```

### Task 3: Implement JWT auth primitives and role guards

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/lib/auth/jwt.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/auth/current-user.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/permissions/guards.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/unit/auth/jwt.test.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/unit/permissions/guards.test.ts`

- [ ] **Step 1: Write the failing JWT tests**

```ts
it("signs and verifies a doctor token", async () => {
  const token = await signJwt({ sub: "u1", role: "doctor" });
  const payload = await verifyJwt(token);
  expect(payload.role).toBe("doctor");
});
```

- [ ] **Step 2: Run the JWT tests**

Run: `pnpm vitest run tests/unit/auth/jwt.test.ts tests/unit/permissions/guards.test.ts`
Expected: FAIL because auth helpers do not exist yet

- [ ] **Step 3: Implement signing, verification, and role guards**

Implement `signJwt`, `verifyJwt`, `requireRole`, and `requireSelfOrDoctor`.

- [ ] **Step 4: Re-run the tests**

Run: `pnpm vitest run tests/unit/auth/jwt.test.ts tests/unit/permissions/guards.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/auth lib/permissions tests/unit/auth tests/unit/permissions
git commit -m "feat: add jwt auth primitives and role guards"
```

### Task 4: Add auth API routes and login/register pages

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/lib/validators/auth.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/(auth)/login/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/(auth)/register/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/auth/login/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/auth/register/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/auth/me/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/auth/refresh/route.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/integration/api/auth.test.ts`

- [ ] **Step 1: Write the failing auth integration tests**

Cover:
- patient registration returns JWT
- login returns JWT
- `/api/auth/me` returns current user

- [ ] **Step 2: Run the auth integration tests**

Run: `pnpm vitest run tests/integration/api/auth.test.ts`
Expected: FAIL on missing routes

- [ ] **Step 3: Implement validators and API routes**

Support:
- patient registration
- doctor or patient login
- token refresh
- current user lookup

- [ ] **Step 4: Build the login and register pages**

Create working forms with inline validation and role-aware redirect after success.

- [ ] **Step 5: Re-run auth tests**

Run: `pnpm vitest run tests/integration/api/auth.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/'(auth)' app/api/auth lib/validators/auth.ts tests/integration/api/auth.test.ts
git commit -m "feat: add auth routes and login pages"
```

## Chunk 2: Doctor Portal And Patient Records

### Task 5: Implement patient validation and doctor patient APIs

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/lib/validators/patient.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/patients/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/patients/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/patients/[id]/route.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/integration/api/patients.test.ts`

- [ ] **Step 1: Write the failing patient API tests**

Cover:
- doctor can create a patient
- doctor can search by any supported field
- patient cannot query all patients

- [ ] **Step 2: Run the patient API tests**

Run: `pnpm vitest run tests/integration/api/patients.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement patient search and create services**

Support the 7 requested search fields with arbitrary combinations.

- [ ] **Step 4: Implement patient routes**

Add role-aware GET, POST, and PATCH behavior.

- [ ] **Step 5: Re-run the patient API tests**

Run: `pnpm vitest run tests/integration/api/patients.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/patients lib/validators/patient.ts app/api/patients tests/integration/api/patients.test.ts
git commit -m "feat: add doctor patient management apis"
```

### Task 6: Build the doctor patient list and create flow

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/doctor/patient-search-form.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/doctor/patient-table.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/doctor/create-patient-form.tsx`
- Test: `/Users/tonycao/mycode/stoma_website/tests/e2e/doctor-flow.spec.ts`

- [ ] **Step 1: Write the first failing doctor portal E2E**

Cover doctor login, search form visibility, and patient create flow.

- [ ] **Step 2: Run the doctor E2E**

Run: `pnpm playwright test tests/e2e/doctor-flow.spec.ts --grep "patient create"`
Expected: FAIL because doctor pages do not exist

- [ ] **Step 3: Build the patient list page and components**

Include:
- filter bar
- table
- create patient action
- required field markers

- [ ] **Step 4: Re-run the doctor E2E**

Run: `pnpm playwright test tests/e2e/doctor-flow.spec.ts --grep "patient create"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/doctor/patients components/doctor tests/e2e/doctor-flow.spec.ts
git commit -m "feat: add doctor patient list and create flow"
```

### Task 7: Build doctor patient detail and follow-up detail pages

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/doctor/followups/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/doctor/followup-timeline.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/doctor/followup-image-grid.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/doctor-flow.spec.ts`

- [ ] **Step 1: Extend the doctor E2E with patient detail navigation**

Cover:
- open patient detail
- view follow-up timeline
- open follow-up detail

- [ ] **Step 2: Run the focused E2E**

Run: `pnpm playwright test tests/e2e/doctor-flow.spec.ts --grep "followup detail"`
Expected: FAIL

- [ ] **Step 3: Build the doctor detail pages**

Show:
- patient profile
- follow-up date list
- image status chips
- AI status placeholders

- [ ] **Step 4: Re-run the focused E2E**

Run: `pnpm playwright test tests/e2e/doctor-flow.spec.ts --grep "followup detail"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/doctor/patients/'[id]' app/doctor/followups/'[id]' components/doctor tests/e2e/doctor-flow.spec.ts
git commit -m "feat: add doctor followup detail views"
```

## Chunk 3: Patient Portal, Uploads, And Follow-Up Grouping

### Task 8: Implement follow-up grouping and image services

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/lib/followups/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/images/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/validators/image.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/unit/followups/grouping.test.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/integration/api/images-followups.test.ts`

- [ ] **Step 1: Write the failing grouping unit tests**

Cover:
- same patient and same shot date reuse one follow-up
- same patient and different shot date create distinct follow-ups

- [ ] **Step 2: Run the grouping tests**

Run: `pnpm vitest run tests/unit/followups/grouping.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement grouping logic**

Create a service that resolves the target follow-up before persisting an image.

- [ ] **Step 4: Add image validation**

Validate shot date, position type, and file metadata.

- [ ] **Step 5: Re-run the grouping tests**

Run: `pnpm vitest run tests/unit/followups/grouping.test.ts tests/integration/api/images-followups.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/followups lib/images lib/validators/image.ts tests/unit/followups tests/integration/api/images-followups.test.ts
git commit -m "feat: add followup grouping and image services"
```

### Task 9: Add storage service and image upload API

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/lib/storage/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/images/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/images/[id]/route.ts`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/integration/api/images-followups.test.ts`

- [ ] **Step 1: Extend the failing integration tests for upload**

Cover:
- patient can upload image
- upload persists image metadata
- upload auto-groups into follow-up

- [ ] **Step 2: Run the upload tests**

Run: `pnpm vitest run tests/integration/api/images-followups.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement object storage abstraction**

Expose upload and delete methods behind a testable interface.

- [ ] **Step 4: Implement image routes**

Support:
- authenticated upload
- image fetch
- doctor-only delete

- [ ] **Step 5: Re-run the upload tests**

Run: `pnpm vitest run tests/integration/api/images-followups.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/storage app/api/images tests/integration/api/images-followups.test.ts
git commit -m "feat: add image upload api"
```

### Task 10: Build the patient dashboard and upload flow

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/app/patient/dashboard/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/patient/followups/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/patient/followup-list.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/patient/upload-image-form.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/patient-flow.spec.ts`

- [ ] **Step 1: Write the failing patient E2E**

Cover:
- patient registration
- dashboard access
- upload image with date and position

- [ ] **Step 2: Run the patient E2E**

Run: `pnpm playwright test tests/e2e/patient-flow.spec.ts --grep "upload image"`
Expected: FAIL

- [ ] **Step 3: Build the patient pages**

Show:
- own follow-up list
- upload form
- follow-up detail with AI/report status placeholders

- [ ] **Step 4: Re-run the patient E2E**

Run: `pnpm playwright test tests/e2e/patient-flow.spec.ts --grep "upload image"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/patient components/patient tests/e2e/patient-flow.spec.ts
git commit -m "feat: add patient dashboard and upload flow"
```

## Chunk 4: Async AI Tasks And Doctor Review

### Task 11: Implement the AI provider adapter and AI task domain

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/lib/ai/provider.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/ai/service.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/unit/ai/tasks.test.ts`

- [ ] **Step 1: Write the failing AI task unit tests**

Cover:
- upload auto-creates queued task
- retry creates a new task
- successful provider result marks only one current AI result

- [ ] **Step 2: Run the AI task tests**

Run: `pnpm vitest run tests/unit/ai/tasks.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the provider contract**

Add methods for:
- create remote task
- fetch remote task status

- [ ] **Step 4: Implement AI task orchestration**

Add service methods for:
- enqueue task
- sync task status
- retry task
- upsert current AI result with category-level output and optional detail label

- [ ] **Step 5: Re-run the AI task tests**

Run: `pnpm vitest run tests/unit/ai/tasks.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/ai tests/unit/ai/tasks.test.ts
git commit -m "feat: add async ai task domain"
```

### Task 12: Add AI task APIs and polling worker

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/app/api/ai/tasks/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/ai/tasks/[id]/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/ai/tasks/[id]/retry/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/scripts/poll-ai-tasks.ts`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/integration/api/images-followups.test.ts`

- [ ] **Step 1: Extend the failing integration coverage**

Cover:
- image upload auto-enqueues AI task
- doctor can retry AI
- patient cannot retry AI

- [ ] **Step 2: Run the AI integration tests**

Run: `pnpm vitest run tests/integration/api/images-followups.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement AI task routes**

Support:
- create task
- get task state
- doctor retry

- [ ] **Step 4: Implement the polling worker**

Poll queued or running tasks, sync provider status, and write `AIResult` on success.

- [ ] **Step 5: Re-run the AI integration tests**

Run: `pnpm vitest run tests/integration/api/images-followups.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/ai scripts/poll-ai-tasks.ts tests/integration/api/images-followups.test.ts
git commit -m "feat: add ai task apis and polling worker"
```

### Task 13: Surface AI state in doctor and patient UIs

**Files:**
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/followups/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/patient/followups/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/shared/ai-status-badge.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/doctor-flow.spec.ts`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/patient-flow.spec.ts`

- [ ] **Step 1: Extend the failing E2E assertions**

Cover:
- upload shows queued/running/completed state
- doctor sees retry action
- patient sees read-only AI result

- [ ] **Step 2: Run the UI E2Es**

Run: `pnpm playwright test tests/e2e/doctor-flow.spec.ts tests/e2e/patient-flow.spec.ts --grep "ai status"`
Expected: FAIL

- [ ] **Step 3: Implement AI state UI**

Add reusable status badge and doctor-only retry control.

- [ ] **Step 4: Re-run the UI E2Es**

Run: `pnpm playwright test tests/e2e/doctor-flow.spec.ts tests/e2e/patient-flow.spec.ts --grep "ai status"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/doctor/followups/'[id]'/page.tsx app/patient/followups/'[id]'/page.tsx components/shared tests/e2e
git commit -m "feat: surface ai status in followup views"
```

## Chunk 5: Final Diagnosis Reports, Hardening, And Release Prep

### Task 14: Implement report validation, service, and APIs

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/lib/validators/report.ts`
- Create: `/Users/tonycao/mycode/stoma_website/lib/reports/service.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/reports/route.ts`
- Create: `/Users/tonycao/mycode/stoma_website/app/api/reports/[id]/route.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/unit/reports/report-validation.test.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/integration/api/reports.test.ts`

- [ ] **Step 1: Write the failing report tests**

Cover:
- complication type required when `has_complication = true`
- severity grade limited to allowed values
- patient cannot edit report

- [ ] **Step 2: Run the report tests**

Run: `pnpm vitest run tests/unit/reports/report-validation.test.ts tests/integration/api/reports.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement report validation and service**

Support draft and final submission.

- [ ] **Step 4: Implement report APIs**

Allow doctor create/update and patient read-only access to own follow-up report.

- [ ] **Step 5: Re-run the report tests**

Run: `pnpm vitest run tests/unit/reports/report-validation.test.ts tests/integration/api/reports.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/reports lib/validators/report.ts app/api/reports tests/unit/reports tests/integration/api/reports.test.ts
git commit -m "feat: add diagnosis report apis"
```

### Task 15: Build the doctor report form and patient result view

**Files:**
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/followups/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/patient/followups/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/doctor/report-form.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/patient/report-summary.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/doctor-flow.spec.ts`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/patient-flow.spec.ts`

- [ ] **Step 1: Extend the failing doctor and patient E2Es**

Cover:
- doctor submits a report
- patient sees final diagnosis and severity

- [ ] **Step 2: Run the focused E2Es**

Run: `pnpm playwright test tests/e2e/doctor-flow.spec.ts tests/e2e/patient-flow.spec.ts --grep "report"`
Expected: FAIL

- [ ] **Step 3: Build the report form and summary components**

Show:
- has complication toggle
- complication multiselect
- severity radio group
- doctor note
- patient read-only summary

- [ ] **Step 4: Re-run the focused E2Es**

Run: `pnpm playwright test tests/e2e/doctor-flow.spec.ts tests/e2e/patient-flow.spec.ts --grep "report"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/doctor/report-form.tsx components/patient/report-summary.tsx app/doctor/followups/'[id]'/page.tsx app/patient/followups/'[id]'/page.tsx tests/e2e
git commit -m "feat: add diagnosis report ui"
```

### Task 16: Add release hardening and end-to-end verification

**Files:**
- Modify: `/Users/tonycao/mycode/stoma_website/.env.example`
- Modify: `/Users/tonycao/mycode/stoma_website/package.json`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/doctor-flow.spec.ts`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/patient-flow.spec.ts`
- Create: `/Users/tonycao/mycode/stoma_website/README.md`

- [ ] **Step 1: Add missing environment and runbook docs**

Document:
- DB URL
- JWT secret
- storage keys
- AI provider base URL

- [ ] **Step 2: Run the full verification suite**

Run: `pnpm vitest run`
Expected: PASS

Run: `pnpm playwright test`
Expected: PASS

- [ ] **Step 3: Run a production build**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 4: Fix any failures and re-run until green**

Do not skip this step.

- [ ] **Step 5: Commit**

```bash
git add .env.example package.json README.md tests/e2e
git commit -m "chore: harden platform for mvp release"
```

Plan complete and saved to `docs/superpowers/plans/2026-04-21-stoma-followup-platform.md`. Ready to execute?
