import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enqueueAiTask,
  getAiTaskById,
  listAiResultsForImage,
  listAiTasksForImage,
  retryAiTaskForImage,
  syncAiTaskById
} from "@/lib/ai/service";
import { prisma } from "@/lib/db/prisma";
import { createImageRecord } from "@/lib/images/service";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const sampleImagePath = path.resolve(
  process.cwd(),
  "tests/data/T001322119-2022-10-11_151502-2577696.jpg"
);

async function createTestImage(imageKey: string) {
  const { image } = await createImageRecord({
    patientId: "pat-1001",
    metadata: {
      shotDate: "2026-04-21",
      positionType: "sitting_front"
    },
    storageKey: `${imageKey}.jpg`,
    fileUrl: `/tmp/${imageKey}.jpg`,
    originalFilename: `${imageKey}.jpg`,
    uploadedByUserId: "patient-1"
  });

  return image;
}

describe("ai task domain", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("enqueues a queued task for a newly uploaded image", async () => {
    vi.stubEnv("AI_PROVIDER_MODE", "mock");
    const image = await createTestImage("img-enqueue-1");
    const task = await enqueueAiTask({
      imageId: image.id,
      imageUrl: image.fileUrl,
      triggerSource: "auto"
    });

    expect(task.status).toBe("queued");
    expect(task.triggerSource).toBe("auto");
  });

  it("creates a new task when a doctor retries ai", async () => {
    vi.stubEnv("AI_PROVIDER_MODE", "mock");
    const image = await createTestImage("img-retry-1");
    await enqueueAiTask({
      imageId: image.id,
      imageUrl: image.fileUrl,
      triggerSource: "auto"
    });

    const retried = await retryAiTaskForImage({
      imageId: image.id,
      imageUrl: image.fileUrl,
      requestedByUserId: "doctor-1"
    });

    const tasks = await listAiTasksForImage(image.id);

    expect(retried.triggerSource).toBe("manual");
    expect(tasks).toHaveLength(2);
  });

  it("marks only one ai result as current after a successful sync", async () => {
    vi.stubEnv("AI_PROVIDER_MODE", "mock");
    const image = await createTestImage("img-result-1");
    const firstTask = await enqueueAiTask({
      imageId: image.id,
      imageUrl: image.fileUrl,
      triggerSource: "auto"
    });
    await syncAiTaskById(firstTask.id);

    const secondTask = await retryAiTaskForImage({
      imageId: image.id,
      imageUrl: image.fileUrl,
      requestedByUserId: "doctor-1"
    });
    await syncAiTaskById(secondTask.id);

    const results = await listAiResultsForImage(image.id);

    expect(results).toHaveLength(2);
    expect(results.filter((result) => result.isCurrent)).toHaveLength(1);
    expect(results[0].category).toBeDefined();
  });

  it("persists a completed task through the configured FastAPI provider", async () => {
    const localImagePath = path.join(os.tmpdir(), `stoma-provider-${Date.now()}.jpg`);
    await writeFile(localImagePath, await readFile(sampleImagePath));
    vi.stubEnv("AI_PROVIDER_BASE_URL", "http://ai-provider.test");
    vi.stubEnv("AI_PROVIDER_MODE", "remote");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            task_id: "predict-1",
            status: "succeeded",
            category: "周围皮肤并发症",
            label: null,
            confidence: 0.97,
            rawResult: {
              binary: {
                modelRun: "P6b-s7",
                hasComplication: true,
                complicationProbability: 0.99,
                threshold: 0.15
              },
              fiveClass: {
                modelRun: "P6b-s2024",
                probabilities: {
                  "周围皮肤并发症": 0.97,
                  "正常": 0.02
                }
              }
            }
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        );
      })
    );

    const image = await createTestImage("img-real-provider");
    await prisma.image.update({
      where: { id: image.id },
      data: { fileUrl: localImagePath }
    });
    const task = await enqueueAiTask({
      imageId: image.id,
      imageUrl: localImagePath,
      triggerSource: "auto"
    });

    expect(task.status).toBe("succeeded");
    await syncAiTaskById(task.id);

    const results = await listAiResultsForImage(image.id);
    const savedTask = await getAiTaskById(task.id);
    const followup = await prisma.followUp.findUnique({
      where: { id: image.followupId },
      select: { status: true }
    });

    expect(savedTask?.status).toBe("succeeded");
    expect(followup?.status).toBe("pending_review");
    expect(results[0].category).toBe("周围皮肤并发症");
    expect(results[0].confidence).toBe(0.97);
    expect(results[0].rawResultJson).toMatchObject({
      binary: { modelRun: "P6b-s7" },
      fiveClass: { modelRun: "P6b-s2024" }
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://ai-provider.test/predict",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("records a failed task when the configured FastAPI provider is unavailable", async () => {
    const localImagePath = path.join(os.tmpdir(), `stoma-provider-failed-${Date.now()}.jpg`);
    await writeFile(localImagePath, await readFile(sampleImagePath));
    vi.stubEnv("AI_PROVIDER_BASE_URL", "http://ai-provider.test/predict");
    vi.stubEnv("AI_PROVIDER_MODE", "remote");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({ error: "model offline" }),
          {
            status: 503,
            headers: { "content-type": "application/json" }
          }
        );
      })
    );

    const image = await createTestImage("img-provider-failed");
    await prisma.image.update({
      where: { id: image.id },
      data: { fileUrl: localImagePath }
    });

    const task = await enqueueAiTask({
      imageId: image.id,
      imageUrl: localImagePath,
      triggerSource: "auto"
    });

    const results = await listAiResultsForImage(image.id);
    expect(task.status).toBe("failed");
    expect(task.errorMessage).toBe("AI_PROVIDER_HTTP_503");
    expect(results).toHaveLength(0);
    expect(fetch).toHaveBeenCalledWith(
      "http://ai-provider.test/predict",
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});
