# Implementation Notes

## 2026-05-20 Remote AI backend demo integration

- Context: local Next.js frontend now supports a remote FastAPI AI provider at `AI_PROVIDER_BASE_URL`, with a fallback `AI_PROVIDER_MODE=mock` mode for demos when the remote service is unavailable.
- Bug: early provider integration ran `/predict` during upload and left the local `AITask` as `queued`, so the successful result lived only in process memory until a later page read called sync.
- Cause: the code mixed a synchronous `/predict` provider with the existing mock provider's queued task lifecycle.
- Fix: `enqueueAiTask` now catches provider failures, writes failed tasks without breaking image upload, and immediately persists `AIResult` plus `succeeded` task status when the remote provider returns a synchronous result.
- Bug: standard Vitest runs loaded `.env` and tried to hit a real provider.
- Fix: `vitest.setup.ts` clears provider env by default unless `AI_PROVIDER_E2E=1`.
- Demo fallback: `AI_PROVIDER_MODE=mock` forces local mock inference. Mock inference uses `originalFilename` so Chinese demo sample names still map to useful categories after upload storage renames the file.
- E2E note: Playwright upload tests must wait for the `/api/images` response before opening the doctor workflow; otherwise the doctor page can be visited before the AI task has completed.

## 2026-05-22 stoma.datummed.com production deployment

- Context: deployed the Next.js app behind Nginx at `https://stoma.datummed.com`, running the app on `127.0.0.1:3010` with SQLite and local uploads. Production AI is configured with `AI_PROVIDER_MODE=remote` and `AI_PROVIDER_BASE_URL=http://100.81.53.40:8000`.
- Bug: the first production build failed with `Parameter 'followup' implicitly has an 'any' type` in `app/api/followups/route.ts`.
- Cause: `pnpm install` had skipped Prisma package build scripts, so Prisma Client generation was missing and Prisma calls degraded to weak inference during Next.js type checking.
- Fix: ran `pnpm prisma:generate` before rebuilding. No application source change was needed; `pnpm build` passed afterward.
- Bug: starting the app with `pm2 start pnpm -- start -- -H 127.0.0.1 -p 3010` repeatedly failed because `next start -- -H ...` treated `-H` as a project directory.
- Cause: argument forwarding through the package script inserted an extra `--` that Next.js did not interpret as intended.
- Fix: first verified a direct Next binary invocation under PM2, then replaced PM2 boot management with a dedicated `stoma-website.service` systemd unit using `node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3010`.
- Bug: trying to write root-owned Nginx/certbot hook files through `sudo tee <<EOF` consumed the heredoc content as sudo password input after cache expiry.
- Cause: sudo reads stdin for the password when `-S` is used, which conflicts with shell heredocs.
- Fix: store deployment files under `deploy/`, then copy them into `/etc` with sudo as separate commands.
- Verification: `https://stoma.datummed.com` returns HTTP 200, HTTP redirects to HTTPS, the certificate CN is `stoma.datummed.com`, doctor login succeeds, and a live image upload produced a succeeded remote AI task with provider task id `predict-a32ca238-3486-4221-92f3-2d013f2a309c`.
