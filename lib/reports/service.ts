import { prisma } from "@/lib/db/prisma";
import { getFollowUpById } from "@/lib/followups/service";
import type { ReportInput } from "@/lib/validators/report";

export type DiagnosisReportRecord = {
  id: string;
  followupId: string;
  hasComplication: boolean;
  complicationTypes: string[];
  severityGrade: "Ia" | "Ib" | "IIa" | "IIb" | "III" | null;
  doctorComment: string;
  reviewedByUserId: string;
  reviewedAt: string;
  status: "draft" | "finalized";
  createdAt: string;
  updatedAt: string;
};

function serializeReport(report: {
  id: string;
  followupId: string;
  hasComplication: boolean;
  complicationTypes: string;
  severityGrade: "Ia" | "Ib" | "IIa" | "IIb" | "III" | null;
  doctorComment: string | null;
  reviewedByUserId: string;
  reviewedAt: Date;
  status: "draft" | "finalized";
  createdAt: Date;
  updatedAt: Date;
}): DiagnosisReportRecord {
  return {
    id: report.id,
    followupId: report.followupId,
    hasComplication: report.hasComplication,
    complicationTypes: JSON.parse(report.complicationTypes) as string[],
    severityGrade: report.severityGrade,
    doctorComment: report.doctorComment ?? "",
    reviewedByUserId: report.reviewedByUserId,
    reviewedAt: report.reviewedAt.toISOString(),
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString()
  };
}

export async function upsertReport(input: ReportInput & { reviewedByUserId: string }) {
  const followup = await getFollowUpById(input.followupId);
  if (!followup) {
    throw new Error("FOLLOWUP_NOT_FOUND");
  }

  const existing = await prisma.diagnosisReport.findUnique({
    where: { followupId: input.followupId }
  });

  const payload = {
    hasComplication: input.hasComplication,
    complicationTypes: JSON.stringify(input.complicationTypes),
    severityGrade: input.severityGrade,
    doctorComment: input.doctorComment,
    reviewedByUserId: input.reviewedByUserId,
    reviewedAt: new Date(),
    status: input.status
  };

  const report = existing
    ? await prisma.diagnosisReport.update({
        where: { followupId: input.followupId },
        data: payload
      })
    : await prisma.diagnosisReport.create({
        data: {
          followupId: input.followupId,
          ...payload
        }
      });

  return serializeReport(report);
}

export async function getReportByFollowupId(followupId: string) {
  const report = await prisma.diagnosisReport.findUnique({
    where: { followupId }
  });

  return report ? serializeReport(report) : null;
}
