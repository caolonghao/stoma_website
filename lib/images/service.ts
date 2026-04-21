import { prisma } from "@/lib/db/prisma";
import { createOrGetFollowUpForShotDate } from "@/lib/followups/service";
import type { ImageUploadMetadata } from "@/lib/validators/image";

export type ImageRecord = {
  id: string;
  followupId: string;
  shotDate: string;
  positionType: "sitting_front" | "sitting_side" | "supine";
  storageKey: string;
  fileUrl: string;
  originalFilename: string;
  uploadedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

function serializeImage(image: {
  id: string;
  followupId: string;
  shotDate: Date;
  positionType: "sitting_front" | "sitting_side" | "supine";
  storageKey: string;
  fileUrl: string;
  originalFilename: string | null;
  uploadedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ImageRecord {
  return {
    id: image.id,
    followupId: image.followupId,
    shotDate: image.shotDate.toISOString().slice(0, 10),
    positionType: image.positionType,
    storageKey: image.storageKey,
    fileUrl: image.fileUrl,
    originalFilename: image.originalFilename ?? "upload.jpg",
    uploadedByUserId: image.uploadedByUserId ?? undefined,
    createdAt: image.createdAt.toISOString(),
    updatedAt: image.updatedAt.toISOString()
  };
}

export async function createImageRecord(input: {
  patientId: string;
  metadata: ImageUploadMetadata;
  storageKey: string;
  fileUrl: string;
  originalFilename: string;
  uploadedByUserId?: string;
  source?: "patient_upload" | "doctor_upload";
}) {
  const followup = await createOrGetFollowUpForShotDate(
    input.patientId,
    input.metadata.shotDate,
    input.source ?? "patient_upload"
  );

  const image = await prisma.image.create({
    data: {
      followupId: followup.id,
      shotDate: new Date(`${input.metadata.shotDate}T00:00:00.000Z`),
      positionType: input.metadata.positionType,
      storageKey: input.storageKey,
      fileUrl: input.fileUrl,
      originalFilename: input.originalFilename,
      uploadedByUserId: input.uploadedByUserId ?? null
    }
  });

  return {
    image: serializeImage(image),
    followup
  };
}

export async function listImagesForFollowup(followupId: string) {
  const images = await prisma.image.findMany({
    where: { followupId },
    orderBy: {
      createdAt: "asc"
    }
  });

  return images.map(serializeImage);
}

export async function getImageById(id: string) {
  const image = await prisma.image.findUnique({
    where: { id }
  });

  return image ? serializeImage(image) : null;
}
