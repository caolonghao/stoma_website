# Stoma Auth Front-End Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public entry flow so `/` becomes the only unauthenticated page, unify patient and doctor auth into one medical-style home screen, and normalize typography/layout hierarchy across the auth shell and first-level workspaces.

**Architecture:** Keep auth enforcement in the App Router server layer so page access rules stay close to `getCurrentUser()` and existing cookie-based identity lookup. Reuse the current login/register APIs and form logic, but move the patient login/register and doctor login modes behind a single homepage component with route-level redirects for `/login` and `/register`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4 via `app/globals.css`, Vitest, Testing Library, Playwright

---

## File Structure

### Planned auth and page-access structure

- Modify: `/Users/tonycao/mycode/stoma_website/app/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/globals.css`
- Create: `/Users/tonycao/mycode/stoma_website/app/doctor/layout.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/patient/layout.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/(auth)/login/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/(auth)/register/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/lib/auth/page-access.ts`
- Create: `/Users/tonycao/mycode/stoma_website/components/auth/unified-auth-card.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/auth/auth-role-tabs.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/auth/auth-mode-tabs.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/login-form.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/register-form.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/auth-shell.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/patient/dashboard/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/patient/followups/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/followups/[id]/page.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/tests/unit/auth/page-access.test.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/unit/auth/unified-auth-card.test.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/full-clinical-flow.spec.ts`
- Create: `/Users/tonycao/mycode/stoma_website/tests/e2e/auth-entry.spec.ts`

## Chunk 1: Lock Down Public And Protected Routes

### Task 1: Add route-decision helpers for homepage and role checks

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/lib/auth/page-access.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/unit/auth/page-access.test.ts`

- [ ] **Step 1: Write the failing page-access tests**

```ts
import { describe, expect, it } from "vitest";
import {
  getHomeDestination,
  canAccessPortal
} from "@/lib/auth/page-access";

describe("page access", () => {
  it("sends a doctor to the doctor workspace", () => {
    expect(getHomeDestination({ sub: "u1", role: "doctor", name: "Dr. Lin" })).toBe("/doctor/patients");
  });

  it("blocks a patient from doctor routes", () => {
    expect(canAccessPortal({ sub: "u2", role: "patient", name: "Li Lei" }, "doctor")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the new unit test to verify it fails**

Run: `pnpm vitest run tests/unit/auth/page-access.test.ts`
Expected: FAIL because `page-access.ts` does not exist yet

- [ ] **Step 3: Implement the minimal route-decision helpers**

```ts
import type { AuthTokenPayload } from "@/lib/auth/jwt";

export function getHomeDestination(user: AuthTokenPayload | null) {
  if (!user) return null;
  return user.role === "doctor" ? "/doctor/patients" : "/patient/dashboard";
}

export function canAccessPortal(
  user: AuthTokenPayload | null,
  portal: "doctor" | "patient"
) {
  return Boolean(user) && user.role === portal;
}
```

- [ ] **Step 4: Re-run the unit test to verify it passes**

Run: `pnpm vitest run tests/unit/auth/page-access.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/auth/page-access.ts tests/unit/auth/page-access.test.ts
git commit -m "test: add route access helpers for auth entry"
```

### Task 2: Make `/` the only public entry and redirect old auth pages

**Files:**
- Modify: `/Users/tonycao/mycode/stoma_website/app/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/(auth)/login/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/(auth)/register/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/auth-shell.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/tests/e2e/full-clinical-flow.spec.ts`
- Test: `/Users/tonycao/mycode/stoma_website/tests/e2e/auth-entry.spec.ts`

- [ ] **Step 1: Write the failing auth-entry e2e spec**

Cover:
- unauthenticated `GET /` renders the unified auth card
- authenticated doctor visiting `/` lands on `/doctor/patients`
- visiting `/login` or `/register` redirects to `/`

```ts
test("unauthenticated users stay on the home auth screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "肠造口随访管理平台" })).toBeVisible();
  await expect(page.getByRole("button", { name: "患者" })).toBeVisible();
});
```

- [ ] **Step 2: Run the auth-entry e2e spec to verify it fails**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts`
Expected: FAIL because the homepage still renders portal cards and old auth routes are separate pages

- [ ] **Step 3: Rewrite `app/page.tsx` around current-user redirect logic**

Implement:
- `await getCurrentUser()`
- `redirect(getHomeDestination(user))` when a user exists
- render the new unified auth shell when no user exists

Use this shape:

```tsx
const user = await getCurrentUser();
const destination = getHomeDestination(user);

if (destination) {
  redirect(destination);
}

return <UnifiedAuthCard />;
```

- [ ] **Step 4: Replace `/login` and `/register` with redirect-only pages**

Use:

```tsx
import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/");
}
```

- [ ] **Step 5: Update the existing full-flow e2e setup**

Change the test to stop using `/login` and `/register` as landing pages after cookie injection. Navigate to `/` or directly to the protected route that should now redirect correctly after auth state is present.

- [ ] **Step 6: Re-run the targeted e2e specs**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts tests/e2e/full-clinical-flow.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/'(auth)'/login/page.tsx app/'(auth)'/register/page.tsx components/auth/auth-shell.tsx tests/e2e/auth-entry.spec.ts tests/e2e/full-clinical-flow.spec.ts
git commit -m "feat: make home the single auth entry"
```

### Task 3: Protect doctor and patient route trees on the server

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/app/doctor/layout.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/app/patient/layout.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/patient/dashboard/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/patient/followups/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/followups/[id]/page.tsx`
- Test: `/Users/tonycao/mycode/stoma_website/tests/e2e/auth-entry.spec.ts`

- [ ] **Step 1: Extend the auth-entry e2e spec with protected-route cases**

Add:
- unauthenticated user opening `/patient/dashboard` is redirected to `/`
- unauthenticated user opening `/doctor/patients` is redirected to `/`
- patient user opening `/doctor/patients` is redirected to `/`
- doctor user opening `/patient/dashboard` is redirected to `/`

- [ ] **Step 2: Run the e2e spec to verify it fails**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts`
Expected: FAIL because the route trees are not guarded yet

- [ ] **Step 3: Add route-tree layout guards**

Implement `app/doctor/layout.tsx` and `app/patient/layout.tsx` around `getCurrentUser()` and `canAccessPortal()`:

```tsx
const user = await getCurrentUser();

if (!canAccessPortal(user, "doctor")) {
  redirect("/");
}

return <>{children}</>;
```

- [ ] **Step 4: Remove in-page “please log in” fallback branches that should now be unreachable**

Delete patient dashboard branches that render login prompts and replace them with simpler authenticated-only rendering assumptions. Do the same for any doctor pages still carrying unauthenticated placeholder copy.

- [ ] **Step 5: Re-run the protected-route e2e spec**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/doctor/layout.tsx app/patient/layout.tsx app/doctor app/patient tests/e2e/auth-entry.spec.ts
git commit -m "feat: lock doctor and patient routes behind server redirects"
```

## Chunk 2: Unify The Home Auth Experience

### Task 4: Build the role-switching auth card component

**Files:**
- Create: `/Users/tonycao/mycode/stoma_website/components/auth/unified-auth-card.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/auth/auth-role-tabs.tsx`
- Create: `/Users/tonycao/mycode/stoma_website/components/auth/auth-mode-tabs.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/login-form.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/register-form.tsx`
- Test: `/Users/tonycao/mycode/stoma_website/tests/unit/auth/unified-auth-card.test.tsx`

- [ ] **Step 1: Write the failing unified-auth-card component tests**

Cover:
- default view is patient login
- switching to patient register shows registration fields
- switching to doctor hides the patient register toggle

```tsx
it("switches from patient login to patient register", async () => {
  render(<UnifiedAuthCard />);
  await user.click(screen.getByRole("button", { name: "注册" }));
  expect(screen.getByLabelText("姓名")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `pnpm vitest run tests/unit/auth/unified-auth-card.test.tsx`
Expected: FAIL because the component does not exist yet

- [ ] **Step 3: Add the role and mode tab components**

Keep them focused:
- `AuthRoleTabs` only renders the `患者 / 医生` switch
- `AuthModeTabs` only renders `登录 / 注册` for patient mode

Use stable button semantics:

```tsx
<button aria-pressed={active === "patient"} type="button">
  患者
</button>
```

- [ ] **Step 4: Refactor the form components for embedded reuse**

Adjust `LoginForm` and `RegisterForm` to accept small props instead of owning page-level framing:
- `role?: "doctor" | "patient"`
- `title`, `description`, or `helperText`
- `onSuccessRedirect?: string`

Do not duplicate submission logic; only separate the copy and redirect target.

- [ ] **Step 5: Implement `UnifiedAuthCard`**

State shape:

```ts
const [role, setRole] = useState<"patient" | "doctor">("patient");
const [patientMode, setPatientMode] = useState<"login" | "register">("login");
```

Render rules:
- doctor => doctor login form only
- patient + login => patient login form
- patient + register => patient register form

- [ ] **Step 6: Re-run the component test**

Run: `pnpm vitest run tests/unit/auth/unified-auth-card.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add components/auth tests/unit/auth/unified-auth-card.test.tsx
git commit -m "feat: add unified patient and doctor auth card"
```

### Task 5: Rework auth copy and interaction details for the new medical-style entry

**Files:**
- Modify: `/Users/tonycao/mycode/stoma_website/app/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/unified-auth-card.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/login-form.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/register-form.tsx`
- Test: `/Users/tonycao/mycode/stoma_website/tests/e2e/auth-entry.spec.ts`

- [ ] **Step 1: Expand the e2e spec with real auth interactions**

Add:
- patient registration from `/` lands on `/patient/dashboard`
- doctor login from `/` lands on `/doctor/patients`

- [ ] **Step 2: Run the auth-entry e2e spec to verify it fails**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts`
Expected: FAIL until the homepage uses the new form composition

- [ ] **Step 3: Finalize role-aware copy and state-reset behavior**

Implement:
- doctor helper text shows default account hint in low-emphasis copy
- switching role clears stale error messages
- switching from patient register back to doctor returns the card to a doctor login state

Use an effect like:

```ts
useEffect(() => {
  setPatientMode("login");
}, [role]);
```

- [ ] **Step 4: Re-run the auth-entry e2e spec**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/auth tests/e2e/auth-entry.spec.ts
git commit -m "feat: finish unified auth interactions on home"
```

## Chunk 3: Normalize Typography And Workspace Surface Hierarchy

### Task 6: Replace the current landing-page aesthetic with a calmer medical UI system

**Files:**
- Modify: `/Users/tonycao/mycode/stoma_website/app/globals.css`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/auth-shell.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/components/auth/unified-auth-card.tsx`
- Test: `/Users/tonycao/mycode/stoma_website/tests/e2e/auth-entry.spec.ts`

- [ ] **Step 1: Add a small visual regression smoke assertion**

In `auth-entry.spec.ts`, assert the page keeps one primary auth card and the hero heading remains visible in a mobile viewport:

```ts
test.use({ viewport: { width: 390, height: 844 } });
```

- [ ] **Step 2: Run the e2e spec to verify the current layout baseline**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts`
Expected: PASS or FAIL, but record current behavior before restyling

- [ ] **Step 3: Replace typography, spacing, and color tokens in `app/globals.css`**

Do all of the following in one pass:
- remove serif-led display hierarchy from auth surfaces
- define a calmer blue-gray background and white card system
- set consistent sizes for page title, card title, body copy, label, helper, and button text
- add role-tab and mode-tab styles for the new auth shell
- reduce decorative noise from the current hero and grid backgrounds

Target scale:

```css
--text-page-title: clamp(1.75rem, 2vw, 2rem);
--text-card-title: 1.375rem;
--text-section-title: 1.0625rem;
--text-body: 0.95rem;
--text-helper: 0.8125rem;
```

- [ ] **Step 4: Restyle `auth-shell.tsx` as a restrained framing component**

Keep only light product context, short supporting copy, and a clean card layout. Remove any leftover dual-entry or marketing-style content that fights the new single-entry design.

- [ ] **Step 5: Re-run the auth-entry e2e spec**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts`
Expected: PASS with the mobile and desktop assertions still succeeding

- [ ] **Step 6: Commit**

```bash
git add app/globals.css components/auth/auth-shell.tsx components/auth/unified-auth-card.tsx tests/e2e/auth-entry.spec.ts
git commit -m "style: apply medical auth typography and layout system"
```

### Task 7: Bring the first-level doctor and patient pages onto the new type scale

**Files:**
- Modify: `/Users/tonycao/mycode/stoma_website/app/patient/dashboard/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/patient/followups/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/patients/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/doctor/followups/[id]/page.tsx`
- Modify: `/Users/tonycao/mycode/stoma_website/app/globals.css`
- Test: `/Users/tonycao/mycode/stoma_website/tests/e2e/full-clinical-flow.spec.ts`

- [ ] **Step 1: Add assertions that confirm the new entry flow still reaches both workspaces**

In the existing full-flow spec, update navigation to pass through `/` where appropriate and keep the upload/report flow intact.

- [ ] **Step 2: Run the full-flow spec to verify baseline behavior**

Run: `pnpm playwright test tests/e2e/full-clinical-flow.spec.ts`
Expected: PASS or surface regressions caused by the new entry flow

- [ ] **Step 3: Replace ad hoc inline heading sizes in workspace pages**

Remove inline `style={{ fontSize: "clamp(...)" }}` heading overrides and switch to shared classes such as:

```tsx
<h1 className="page-title">我的随访</h1>
```

Use shared classes for:
- page titles
- section headings
- secondary explanatory copy

- [ ] **Step 4: Adjust portal grid/card styles to match the new hierarchy**

Tune:
- panel padding
- card heading sizes
- supporting text contrast
- mobile stacking behavior

Keep layout and functionality intact; do not redesign the business flows themselves in this task.

- [ ] **Step 5: Re-run the targeted tests**

Run: `pnpm vitest run tests/unit/auth/page-access.test.ts tests/unit/auth/unified-auth-card.test.tsx`
Expected: PASS

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts tests/e2e/full-clinical-flow.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/doctor app/patient app/globals.css tests/e2e/full-clinical-flow.spec.ts
git commit -m "style: align doctor and patient pages with new type scale"
```

## Final Verification

- [ ] **Step 1: Run the auth-focused unit tests**

Run: `pnpm vitest run tests/unit/auth/page-access.test.ts tests/unit/auth/unified-auth-card.test.tsx`
Expected: PASS

- [ ] **Step 2: Run the auth API integration tests**

Run: `pnpm vitest run tests/integration/api/auth.test.ts`
Expected: PASS

- [ ] **Step 3: Run the end-to-end coverage for auth and the main clinical flow**

Run: `pnpm playwright test tests/e2e/auth-entry.spec.ts tests/e2e/full-clinical-flow.spec.ts`
Expected: PASS

- [ ] **Step 4: Run the project default test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Commit the final verified state**

```bash
git add .
git commit -m "feat: redesign auth entry and tighten route access"
```

Plan complete and saved to `docs/superpowers/plans/2026-04-21-stoma-auth-front-end-redesign.md`. Ready to execute?
