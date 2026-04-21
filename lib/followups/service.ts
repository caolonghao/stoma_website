import { prisma } from "@/lib/db/prisma";

export type FollowUpRecord = {
  id: string;
  patientId: string;
  followupDate: string;
  status: "pending_ai" | "pending_review" | "completed";
  source: "patient_upload" | "doctor_upload";
  createdAt: string;
  updatedAt: string;
};

function serializeFollowup(followup: {
  id: string;
  patientId: string;
  followupDate: Date;
  status: "pending_ai" | "pending_review" | "completed";
  source: "patient_upload" | "doctor_upload";
  createdAt: Date;
  updatedAt: Date;
}): FollowUpRecord {
  return {
    id: followup.id,
    patientId: followup.patientId,
    followupDate: followup.followupDate.toISOString().slice(0, 10),
    status: followup.status,
    source: followup.source,
    createdAt: followup.createdAt.toISOString(),
    updatedAt: followup.updatedAt.toISOString()
  };
}

export async function createOrGetFollowUpForShotDate(
  patientId: string,
  shotDate: string,
  source: FollowUpRecord["source"] = "patient_upload"
) {
  const date = new Date(`${shotDate}T00:00:00.000Z`);
  const existing = await prisma.followUp.findFirst({
    where: {
      patientId,
      followupDate: date
    }
  });

  if (existing) {
    return serializeFollowup(existing);
  }

  const followup = await prisma.followUp.create({
    data: {
      patientId,
      followupDate: date,
      status: "pending_ai",
      source
    }
  });

  return serializeFollowup(followup);
}

export async function listFollowupsForPatient(patientId: string) {
  const followups = await prisma.followUp.findMany({
    where: { patientId },
    orderBy: {
      followupDate: "desc"
    }
  });

  return followups.map(serializeFollowup);
}

export async function listHydratedFollowupsForPatient(patientId: string) {
  const { listImagesForFollowup } = await import("@/lib/images/service");
  const followups = await listFollowupsForPatient(patientId);

  return Promise.all(
    followups.map(async (followup) => {
      const images = await listImagesForFollowup(followup.id);
      return {
        ...followup,
        imageCount: images.length,
        positions: images.map((image) => image.positionType)
      };
    })
  );
}

export async function getFollowUpById(id: string) {
  const followup = await prisma.followUp.findUnique({
    where: { id }
  });

  return followup ? serializeFollowup(followup) : null;
}
