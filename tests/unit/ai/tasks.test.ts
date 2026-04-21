import { describe, expect, it } from "vitest";
import {
  enqueueAiTask,
  listAiResultsForImage,
  listAiTasksForImage,
  retryAiTaskForImage,
  syncAiTaskById
} from "@/lib/ai/service";
import { createImageRecord } from "@/lib/images/service";

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
  it("enqueues a queued task for a newly uploaded image", async () => {
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
});
