import { prisma } from "@/lib/db/prisma";
import { createProviderTask, getProviderTask } from "@/lib/ai/provider";
import { getImageById } from "@/lib/images/service";

export type AITaskRecord = {
  id: string;
  imageId: string;
  triggerSource: "auto" | "manual";
  status: "queued" | "running" | "succeeded" | "failed";
  retryCount: number;
  requestedByUserId?: string;
  providerTaskId: string;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AIResultRecord = {
  id: string;
  imageId: string;
  category: string;
  label: string | null;
  confidence: number | null;
  labelsVersion?: string;
  rawResultJson: Record<string, unknown>;
  isCurrent: boolean;
  createdAt: string;
};

function serializeTask(task: {
  id: string;
  imageId: string;
  triggerSource: "auto" | "manual";
  status: "queued" | "running" | "succeeded" | "failed";
  retryCount: number;
  requestedByUserId: string | null;
  providerTaskId: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AITaskRecord {
  return {
    id: task.id,
    imageId: task.imageId,
    triggerSource: task.triggerSource,
    status: task.status,
    retryCount: task.retryCount,
    requestedByUserId: task.requestedByUserId ?? undefined,
    providerTaskId: task.providerTaskId ?? "",
    errorMessage: task.errorMessage ?? undefined,
    startedAt: task.startedAt?.toISOString(),
    finishedAt: task.finishedAt?.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

function serializeResult(result: {
  id: string;
  imageId: string;
  category: string;
  label: string | null;
  confidence: number | null;
  labelsVersion: string | null;
  rawResultJson: string;
  isCurrent: boolean;
  createdAt: Date;
}): AIResultRecord {
  return {
    id: result.id,
    imageId: result.imageId,
    category: result.category,
    label: result.label,
    confidence: result.confidence,
    labelsVersion: result.labelsVersion ?? undefined,
    rawResultJson: JSON.parse(result.rawResultJson),
    isCurrent: result.isCurrent,
    createdAt: result.createdAt.toISOString()
  };
}

export async function enqueueAiTask(input: {
  imageId: string;
  imageUrl: string;
  triggerSource: "auto" | "manual";
  requestedByUserId?: string;
}) {
  const providerTask = await createProviderTask({
    imageId: input.imageId,
    imageUrl: input.imageUrl
  });

  const retryCount = await prisma.aITask.count({
    where: { imageId: input.imageId }
  });

  const task = await prisma.aITask.create({
    data: {
      imageId: input.imageId,
      triggerSource: input.triggerSource,
      status: "queued",
      retryCount,
      requestedByUserId: input.requestedByUserId ?? null,
      providerTaskId: providerTask.id
    }
  });

  return serializeTask(task);
}

export async function retryAiTaskForImage(input: {
  imageId: string;
  imageUrl: string;
  requestedByUserId: string;
}) {
  return enqueueAiTask({
    imageId: input.imageId,
    imageUrl: input.imageUrl,
    triggerSource: "manual",
    requestedByUserId: input.requestedByUserId
  });
}

export async function listAiTasksForImage(imageId: string) {
  const tasks = await prisma.aITask.findMany({
    where: { imageId },
    orderBy: {
      createdAt: "desc"
    }
  });

  return tasks.map(serializeTask);
}

export async function getAiTaskById(id: string) {
  const task = await prisma.aITask.findUnique({
    where: { id }
  });

  return task ? serializeTask(task) : null;
}

export async function listAiResultsForImage(imageId: string) {
  const results = await prisma.aIResult.findMany({
    where: { imageId },
    orderBy: {
      createdAt: "desc"
    }
  });

  return results.map(serializeResult);
}

export async function getCurrentAiResultForImage(imageId: string) {
  const result = await prisma.aIResult.findFirst({
    where: {
      imageId,
      isCurrent: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return result ? serializeResult(result) : null;
}

export async function getLatestAiTaskForImage(imageId: string) {
  const task = await prisma.aITask.findFirst({
    where: { imageId },
    orderBy: {
      createdAt: "desc"
    }
  });

  return task ? serializeTask(task) : null;
}

export async function syncAiTaskById(id: string) {
  const existing = await prisma.aITask.findUnique({
    where: { id }
  });
  if (!existing) {
    throw new Error("AI_TASK_NOT_FOUND");
  }

  if (existing.status === "succeeded" || existing.status === "failed") {
    return serializeTask(existing);
  }

  await prisma.aITask.update({
    where: { id },
    data: {
      status: "running",
      startedAt: existing.startedAt ?? new Date()
    }
  });

  try {
    const providerTask = await getProviderTask(existing.providerTaskId ?? "");

    if (providerTask.status === "succeeded" && providerTask.result) {
      await prisma.aIResult.updateMany({
        where: { imageId: existing.imageId },
        data: { isCurrent: false }
      });

      await prisma.aIResult.create({
        data: {
          imageId: existing.imageId,
          category: providerTask.result.category,
          label: providerTask.result.label,
          confidence: providerTask.result.confidence,
          labelsVersion: "v1",
          rawResultJson: JSON.stringify(providerTask.result.rawResult),
          isCurrent: true
        }
      });

      const updated = await prisma.aITask.update({
        where: { id },
        data: {
          status: "succeeded",
          finishedAt: new Date()
        }
      });

      return serializeTask(updated);
    }

    const updated = await prisma.aITask.update({
      where: { id },
      data: {
        status: providerTask.status
      }
    });

    return serializeTask(updated);
  } catch (error) {
    const updated = await prisma.aITask.update({
      where: { id },
      data: {
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Unknown AI sync error",
        finishedAt: new Date()
      }
    });

    return serializeTask(updated);
  }
}

export async function getAiSnapshotForImage(
  imageId: string,
  options?: { syncIfPending?: boolean }
) {
  const latestTask = await getLatestAiTaskForImage(imageId);

  if (!latestTask) {
    return {
      aiTask: null,
      aiResult: null
    };
  }

  const aiTask =
    options?.syncIfPending &&
    (latestTask.status === "queued" || latestTask.status === "running")
      ? await syncAiTaskById(latestTask.id)
      : latestTask;

  const aiResult = await getCurrentAiResultForImage(imageId);

  return {
    aiTask,
    aiResult
  };
}

export async function retryAiTaskByTaskId(input: {
  taskId: string;
  requestedByUserId: string;
}) {
  const task = await getAiTaskById(input.taskId);
  if (!task) {
    throw new Error("AI_TASK_NOT_FOUND");
  }

  const image = await getImageById(task.imageId);
  if (!image) {
    throw new Error("IMAGE_NOT_FOUND");
  }

  return retryAiTaskForImage({
    imageId: image.id,
    imageUrl: image.fileUrl,
    requestedByUserId: input.requestedByUserId
  });
}
