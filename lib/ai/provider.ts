import { randomUUID } from "node:crypto";

export type ProviderTaskStatus = "queued" | "running" | "succeeded" | "failed";

export type ProviderTaskRecord = {
  id: string;
  imageId: string;
  imageUrl: string;
  status: ProviderTaskStatus;
  result: {
    category: string;
    label: null;
    confidence: number;
    rawResult: Record<string, unknown>;
  } | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

const globalProviderStore = globalThis as typeof globalThis & {
  stomaAiProviderTasks?: ProviderTaskRecord[];
};

function getProviderTasksStore() {
  if (!globalProviderStore.stomaAiProviderTasks) {
    globalProviderStore.stomaAiProviderTasks = [];
  }

  return globalProviderStore.stomaAiProviderTasks;
}

function inferCategory(imageUrl: string) {
  const lower = imageUrl.toLowerCase();

  if (lower.includes("derma") || lower.includes("skin")) {
    return "周围皮肤并发症";
  }

  if (lower.includes("bleed")) {
    return "肠管及系膜并发症";
  }

  return "正常";
}

export async function createProviderTask(input: {
  imageId: string;
  imageUrl: string;
}) {
  const now = new Date().toISOString();
  const record: ProviderTaskRecord = {
    id: `provider-${randomUUID()}`,
    imageId: input.imageId,
    imageUrl: input.imageUrl,
    status: "queued",
    result: null,
    error: null,
    createdAt: now,
    updatedAt: now
  };

  getProviderTasksStore().unshift(record);
  return record;
}

export async function getProviderTask(providerTaskId: string) {
  const task = getProviderTasksStore().find((item) => item.id === providerTaskId);

  if (!task) {
    throw new Error("PROVIDER_TASK_NOT_FOUND");
  }

  if (task.status === "queued") {
    task.status = "succeeded";
    task.result = {
      category: inferCategory(task.imageUrl),
      label: null,
      confidence: 0.82,
      rawResult: {
        precision: "category-only"
      }
    };
    task.updatedAt = new Date().toISOString();
  }

  return task;
}
