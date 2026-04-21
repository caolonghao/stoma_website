import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/http";
import { requireRole } from "@/lib/permissions/guards";
import { upsertReport } from "@/lib/reports/service";
import { reportSchema } from "@/lib/validators/report";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    requireRole(user, ["doctor", "admin"]);

    const parsed = reportSchema.parse(await request.json());
    const report = await upsertReport({
      ...parsed,
      reviewedByUserId: user!.sub
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Insufficient permissions") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message === "FOLLOWUP_NOT_FOUND") {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
  }
}
