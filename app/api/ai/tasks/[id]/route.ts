import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/http";
import {
  getAiTaskById,
  getCurrentAiResultForImage,
  syncAiTaskById
} from "@/lib/ai/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getAiTaskById(id);

  if (!existing) {
    return NextResponse.json({ error: "AI task not found" }, { status: 404 });
  }

  const aiTask =
    existing.status === "queued" || existing.status === "running"
      ? await syncAiTaskById(existing.id)
      : existing;
  const aiResult = await getCurrentAiResultForImage(aiTask.imageId);

  return NextResponse.json({
    aiTask,
    aiResult
  });
}
