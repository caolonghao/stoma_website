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
