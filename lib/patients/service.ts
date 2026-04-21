import { prisma } from "@/lib/db/prisma";
import { ensureCoreData } from "@/lib/db/seed";
import type {
  CreatePatientInput,
  PatientSearchInput
} from "@/lib/validators/patient";
import { listFollowupsForPatient } from "@/lib/followups/service";
import { listImagesForFollowup } from "@/lib/images/service";
import { getReportByFollowupId } from "@/lib/reports/service";

export type PatientRecord = {
  id: string;
  userId?: string;
  name: string;
  gender: "male" | "female" | "unknown";
  birthDate?: string;
  phone?: string;
  stomaDate?: string;
  stomaType: "ileostomy" | "colostomy";
  medicalRecordNo: string;
  profileSource: "doctor_created" | "patient_registered";
  createdAt: string;
  updatedAt: string;
};

export type PatientImagePreview = {
  id: string;
  browserUrl: string;
  originalFilename: string;
  positionType: "sitting_front" | "sitting_side" | "supine";
  shotDate: string;
};

export type PatientFollowupOverview = {
  id: string;
  followupDate: string;
  status: "pending_ai" | "pending_review" | "completed";
  imageCount: number;
  positions: string[];
  images: PatientImagePreview[];
  report: {
    status: "draft" | "finalized";
    conclusion: string;
    severityGrade: "Ia" | "Ib" | "IIa" | "IIb" | "III" | null;
    doctorComment: string;
  } | null;
};

export type PatientOverviewRecord = PatientRecord & {
  followupCount: number;
  totalImageCount: number;
  latestFollowupDate?: string;
  followups: PatientFollowupOverview[];
};

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

function serializePatient(patient: {
  id: string;
  userId: string | null;
  name: string;
  gender: "male" | "female" | "unknown";
  birthDate: Date | null;
  phone: string | null;
  stomaDate: Date | null;
  stomaType: "ileostomy" | "colostomy" | null;
  medicalRecordNo: string | null;
  profileSource: "doctor_created" | "patient_registered";
  createdAt: Date;
  updatedAt: Date;
}): PatientRecord {
  return {
    id: patient.id,
    userId: patient.userId ?? undefined,
    name: patient.name,
    gender: patient.gender,
    birthDate: formatDate(patient.birthDate),
    phone: patient.phone ?? undefined,
    stomaDate: formatDate(patient.stomaDate),
    stomaType: patient.stomaType ?? "colostomy",
    medicalRecordNo: patient.medicalRecordNo ?? "",
    profileSource: patient.profileSource,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString()
  };
}

function buildSearchWhere(filters: PatientSearchInput) {
  return {
    ...(filters.name
      ? {
          name: {
            contains: filters.name
          }
        }
      : {}),
    ...(filters.gender ? { gender: filters.gender } : {}),
    ...(filters.birthDate ? { birthDate: new Date(filters.birthDate) } : {}),
    ...(filters.phone
      ? {
          phone: {
            contains: filters.phone
          }
        }
      : {}),
    ...(filters.stomaDate ? { stomaDate: new Date(filters.stomaDate) } : {}),
    ...(filters.stomaType ? { stomaType: filters.stomaType } : {}),
    ...(filters.medicalRecordNo
      ? {
          medicalRecordNo: {
            contains: filters.medicalRecordNo
          }
        }
      : {})
  };
}

async function hydratePatientOverview(patient: PatientRecord): Promise<PatientOverviewRecord> {
  const followups = await listFollowupsForPatient(patient.id);

  const hydratedFollowups = await Promise.all(
    followups.map(async (followup) => {
      const images = await listImagesForFollowup(followup.id);
      const report = await getReportByFollowupId(followup.id);

      return {
        id: followup.id,
        followupDate: followup.followupDate,
        status: followup.status,
        imageCount: images.length,
        positions: images.map((image) => image.positionType),
        images: images.map((image) => ({
          id: image.id,
          browserUrl: `/api/images/${image.id}`,
          originalFilename: image.originalFilename,
          positionType: image.positionType,
          shotDate: image.shotDate
        })),
        report: report
          ? {
              status: report.status,
              conclusion: report.hasComplication ? report.complicationTypes.join("、") : "正常",
              severityGrade: report.severityGrade,
              doctorComment: report.doctorComment
            }
          : null
      } satisfies PatientFollowupOverview;
    })
  );

  return {
    ...patient,
    followupCount: hydratedFollowups.length,
    totalImageCount: hydratedFollowups.reduce((total, item) => total + item.imageCount, 0),
    latestFollowupDate: hydratedFollowups[0]?.followupDate,
    followups: hydratedFollowups
  };
}

export async function listPatients(filters: PatientSearchInput = {}) {
  await ensureCoreData();

  const patients = await prisma.patient.findMany({
    where: buildSearchWhere(filters),
    orderBy: {
      createdAt: "desc"
    }
  });

  return patients.map(serializePatient);
}

export async function createPatient(input: CreatePatientInput) {
  await ensureCoreData();

  if (input.phone) {
    const duplicatePhone = await prisma.patient.findFirst({
      where: { phone: input.phone }
    });
    if (duplicatePhone) {
      throw new Error("PHONE_EXISTS");
    }
  }

  const duplicateMrn = await prisma.patient.findFirst({
    where: { medicalRecordNo: input.medicalRecordNo }
  });
  if (duplicateMrn) {
    throw new Error("MRN_EXISTS");
  }

  const patient = await prisma.patient.create({
    data: {
      name: input.name,
      gender: input.gender,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      phone: input.phone ?? null,
      stomaDate: input.stomaDate ? new Date(input.stomaDate) : null,
      stomaType: input.stomaType,
      medicalRecordNo: input.medicalRecordNo,
      profileSource: "doctor_created"
    }
  });

  return serializePatient(patient);
}

export async function getPatientById(id: string) {
  await ensureCoreData();

  const patient = await prisma.patient.findUnique({
    where: { id }
  });

  return patient ? serializePatient(patient) : null;
}

export async function getPatientOverviewById(id: string) {
  const patient = await getPatientById(id);

  return patient ? hydratePatientOverview(patient) : null;
}

export async function getPatientByUserId(userId: string) {
  await ensureCoreData();

  const patient = await prisma.patient.findUnique({
    where: { userId }
  });

  return patient ? serializePatient(patient) : null;
}

export async function listPatientOverviews(filters: PatientSearchInput = {}) {
  const patients = await listPatients(filters);

  return Promise.all(patients.map(hydratePatientOverview));
}

export async function createOrLinkPatientProfileForUser(input: {
  userId: string;
  name: string;
  phone: string;
}) {
  await ensureCoreData();

  const byUserId = await prisma.patient.findUnique({
    where: { userId: input.userId }
  });
  if (byUserId) {
    return serializePatient(byUserId);
  }

  const byPhone = await prisma.patient.findFirst({
    where: { phone: input.phone }
  });
  if (byPhone) {
    const linked = await prisma.patient.update({
      where: { id: byPhone.id },
      data: {
        userId: input.userId,
        profileSource: "patient_registered"
      }
    });
    return serializePatient(linked);
  }

  const patient = await prisma.patient.create({
    data: {
      userId: input.userId,
      name: input.name,
      gender: "unknown",
      phone: input.phone,
      stomaType: "colostomy",
      medicalRecordNo: `AUTO-${input.phone.slice(-6)}`,
      profileSource: "patient_registered"
    }
  });

  return serializePatient(patient);
}
