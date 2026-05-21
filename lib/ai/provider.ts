import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type ProviderTaskStatus = "queued" | "running" | "succeeded" | "failed";

export type ProviderTaskRecord = {
  id: string;
  imageId: string;
  imageUrl: string;
  status: ProviderTaskStatus;
  result: {
    category: string;
    label: string | null;
    confidence: number | null;
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

  if (
    lower.includes("derma") ||
    lower.includes("skin") ||
    lower.includes("皮炎") ||
    lower.includes("皮肤")
  ) {
    return "周围皮肤并发症";
  }

  if (
    lower.includes("bleed") ||
    lower.includes("水肿") ||
    lower.includes("出血") ||
    lower.includes("坏死")
  ) {
    return "肠管及系膜并发症";
  }

  if (lower.includes("切口") || lower.includes("愈合不良")) {
    return "腹壁切口并发症";
  }

  if (
    lower.includes("凹陷") ||
    lower.includes("脱垂") ||
    lower.includes("回缩") ||
    lower.includes("狭窄") ||
    lower.includes("旁疝")
  ) {
    return "腹壁隧道并发症";
  }

  return "正常";
}

function getProviderBaseUrl() {
  if (process.env.AI_PROVIDER_MODE === "mock") {
    return undefined;
  }

  return process.env.AI_PROVIDER_BASE_URL?.replace(/\/+$/, "");
}

function getPredictUrl(baseUrl: string) {
  return baseUrl.endsWith("/predict") ? baseUrl : `${baseUrl}/predict`;
}

function getProviderToken() {
  const token = process.env.AI_PROVIDER_TOKEN;
  return token && token !== "replace-me" ? token : undefined;
}

function getProviderTimeoutMs() {
  const rawTimeout = Number(process.env.AI_PROVIDER_TIMEOUT_MS);
  return Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 30_000;
}

function parseProviderResponse(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new Error("AI_PROVIDER_INVALID_RESPONSE");
  }

  const payload = body as Record<string, unknown>;
  if (payload.status === "failed") {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "AI_PROVIDER_FAILED"
    );
  }

  if (typeof payload.category !== "string" || payload.category.length === 0) {
    throw new Error("AI_PROVIDER_MISSING_CATEGORY");
  }

  const confidence = payload.confidence;
  if (
    confidence !== undefined &&
    confidence !== null &&
    (typeof confidence !== "number" || confidence < 0 || confidence > 1)
  ) {
    throw new Error("AI_PROVIDER_INVALID_CONFIDENCE");
  }

  return {
    taskId: String(payload.task_id ?? `provider-${randomUUID()}`),
    result: {
      category: payload.category,
      label: typeof payload.label === "string" ? payload.label : null,
      confidence: typeof confidence === "number" ? confidence : null,
      rawResult:
        payload.rawResult && typeof payload.rawResult === "object"
          ? (payload.rawResult as Record<string, unknown>)
          : payload
    }
  };
}

async function predictWithFastApiProvider(input: {
  imageId: string;
  imageUrl: string;
  originalFilename?: string;
}) {
  const baseUrl = getProviderBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const absolutePath = path.resolve(input.imageUrl);
  const buffer = await readFile(absolutePath);
  const filename = path.basename(absolutePath) || `${input.imageId}.jpg`;
  const form = new FormData();
  form.append("file", new Blob([buffer]), filename);

  const headers: Record<string, string> = {};
  const token = getProviderToken();
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getProviderTimeoutMs());
  let response: Response;
  try {
    response = await fetch(getPredictUrl(baseUrl), {
      method: "POST",
      headers,
      body: form,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`AI_PROVIDER_HTTP_${response.status}`);
  }

  const body = await response.json();
  return parseProviderResponse(body);
}

export async function createProviderTask(input: {
  imageId: string;
  imageUrl: string;
  originalFilename?: string;
}) {
  const now = new Date().toISOString();
  const prediction = await predictWithFastApiProvider(input);
  const record: ProviderTaskRecord = {
    id: prediction?.taskId ?? `provider-${randomUUID()}`,
    imageId: input.imageId,
    imageUrl: input.originalFilename ?? input.imageUrl,
    status: prediction ? "succeeded" : "queued",
    result: prediction?.result ?? null,
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
