# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router application for stoma follow-up workflows. Route code lives in `app/`: `app/doctor/*`, `app/patient/*`, and `app/api/*`. Components are grouped by role in `components/auth`, `components/doctor`, `components/patient`, and `components/shared`. Domain logic belongs in `lib/*` modules such as `lib/auth`, `lib/db`, `lib/followups`, `lib/images`, `lib/reports`, and `lib/ai`. Prisma and SQLite schema files live in `prisma/`. Tests are under `tests/unit`, `tests/integration`, and `tests/e2e`.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies with the pinned package manager.
- `pnpm dev`: push the Prisma schema, then start Next.js locally on port 3000.
- `pnpm build`: push the schema and create a production build.
- `pnpm lint`: run ESLint with the Next.js flat-config setup.
- `pnpm test`: run unit and integration tests after syncing the database.
- `pnpm test:unit` / `pnpm test:integration`: run one Vitest layer.
- `pnpm test:e2e`: run Playwright browser tests.
- `pnpm prisma:generate` / `pnpm prisma:push`: refresh Prisma Client or sync schema manually.

## Coding Style & Naming Conventions

Use TypeScript, React function components, 2-space indentation, double quotes, and semicolons. Prefer named service functions in `lib/<domain>/service.ts` and Zod validators in `lib/validators`. Keep route handlers thin: validate input, call services, and return JSON. Component files use kebab-case; exported React components use PascalCase.

## Testing Guidelines

Vitest covers unit and integration tests and excludes `tests/e2e/**`; Playwright owns browser flows. Name tests `*.test.ts`, `*.test.tsx`, or `*.spec.ts`. Add unit tests for pure domain logic, integration tests for API/database behavior, and Playwright coverage for clinical flows. Test setup resets SQLite data and reseeds default accounts automatically.

## Commit & Pull Request Guidelines

Recent commits use Conventional Commits such as `docs: add auth front-end redesign spec and plan` and `chore: initialize stoma follow-up platform`. Keep subjects imperative and scoped. PRs should include a change summary, tests run, screenshots for UI changes, and schema or environment changes.

## Security & Configuration

Copy `.env.example` to `.env` for local development. Do not commit `.env`, `uploads/`, `test-results/`, `.next/`, `node_modules/`, or `prisma/dev.db`. Current MVP storage is local filesystem and SQLite; preserve these defaults unless deployment architecture changes.

## Agent-Specific Instructions

When answering library, framework, SDK, API, CLI, or cloud-service questions, use Context7 first: run `npx ctx7@latest library <name> "<question>"`, choose the best `/org/project` ID, then run `npx ctx7@latest docs <id> "<question>"`. Do not use Context7 for business-logic debugging, general refactors, or code review.

## Update Harness

1. 进行完任何大范围的更新后，需要调用两个sub Agent，分别从代码满足需求的正确性、代码的可扩展与可维护性来对代码进行审核。
2. 任何更新在提交前都需要使用两个 sub agent，分别从功能正确性、易用性进行完整的测试。
3. 你需要记录一个`MEMORY.md`，所有实现过程中遇到的较难解决的 bug，最终的解决方案与产生原因等，都需要在其中进行完整的记录，方便查阅。
