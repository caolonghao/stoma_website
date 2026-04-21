import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/http";
import { requireRole } from "@/lib/permissions/guards";
import { retryAiTaskByTaskId } from "@/lib/ai/service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    requireRole(user, ["doctor", "admin"]);

    const { id } = await context.params;
    const aiTask = await retryAiTaskByTaskId({
      taskId: id,
      requestedByUserId: user!.sub
    });

    return NextResponse.json({ aiTask }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message === "AI_TASK_NOT_FOUND") {
      return NextResponse.json({ error: "AI task not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to retry AI task" }, { status: 400 });
  }
}
