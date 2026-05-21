import { PrismaClient } from "@prisma/client";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const projectRoot = process.cwd();
const sampleRoot =
  process.env.DEMO_SAMPLE_ROOT ||
  "/Users/tonycao/Downloads/stoma_demo_correct_samples";
const uploadRoot = path.resolve(projectRoot, "uploads", "demo-seed");

const categoryDetails = {
  "正常": {
    complicationTypes: [],
    severityGrade: null,
    hasComplication: false,
    comment: "演示报告：当前未见明显造口相关并发症，建议继续按常规随访。"
  },
  "周围皮肤并发症": {
    complicationTypes: ["刺激性皮炎"],
    severityGrade: "Ib",
    hasComplication: true,
    comment: "演示报告：AI 提示周围皮肤并发症，医生确认以刺激性皮炎为主，建议加强皮肤保护。"
  },
  "肠管及系膜并发症": {
    complicationTypes: ["造口水肿"],
    severityGrade: "Ib",
    hasComplication: true,
    comment: "演示报告：AI 提示肠管及系膜并发症，医生确认存在造口水肿，建议观察颜色和排出情况。"
  },
  "腹壁切口并发症": {
    complicationTypes: ["非感染性愈合不良"],
    severityGrade: "IIa",
    hasComplication: true,
    comment: "演示报告：AI 提示腹壁切口并发症，医生确认非感染性愈合不良，建议规范换药。"
  },
  "腹壁隧道并发症": {
    complicationTypes: ["造口凹陷"],
    severityGrade: "Ib",
    hasComplication: true,
    comment: "演示报告：AI 提示腹壁隧道并发症，医生确认造口凹陷，建议评估底盘贴合。"
  }
};

const patients = [
  {
    id: "demo-pat-normal",
    userId: "demo-user-normal",
    name: "演示患者-正常",
    gender: "female",
    phone: "13910000001",
    birthDate: "1982-03-11",
    stomaDate: "2026-04-01",
    stomaType: "colostomy",
    medicalRecordNo: "DEMO-NORMAL",
    category: "正常"
  },
  {
    id: "demo-pat-skin",
    userId: "demo-user-skin",
    name: "演示患者-皮肤",
    gender: "female",
    phone: "13910000002",
    birthDate: "1978-08-20",
    stomaDate: "2026-04-03",
    stomaType: "ileostomy",
    medicalRecordNo: "DEMO-SKIN",
    category: "周围皮肤并发症"
  },
  {
    id: "demo-pat-bowel",
    userId: null,
    name: "演示患者-肠管",
    gender: "male",
    phone: "13910000003",
    birthDate: "1972-12-05",
    stomaDate: "2026-04-05",
    stomaType: "ileostomy",
    medicalRecordNo: "DEMO-BOWEL",
    category: "肠管及系膜并发症"
  },
  {
    id: "demo-pat-incision",
    userId: null,
    name: "演示患者-切口",
    gender: "female",
    phone: "13910000004",
    birthDate: "1969-05-16",
    stomaDate: "2026-04-07",
    stomaType: "colostomy",
    medicalRecordNo: "DEMO-INCISION",
    category: "腹壁切口并发症"
  },
  {
    id: "demo-pat-tunnel",
    userId: null,
    name: "演示患者-隧道",
    gender: "male",
    phone: "13910000005",
    birthDate: "1985-10-02",
    stomaDate: "2026-04-09",
    stomaType: "colostomy",
    medicalRecordNo: "DEMO-TUNNEL",
    category: "腹壁隧道并发症"
  }
];

function dateAtUtc(date) {
  return new Date(`${date}T00:00:00.000Z`);
}

async function readManifest() {
  const content = await readFile(path.join(sampleRoot, "manifest.jsonl"), "utf8");
  return content
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function clearDemoData() {
  const imageIds = (
    await prisma.image.findMany({
      where: { id: { startsWith: "demo-img-" } },
      select: { id: true }
    })
  ).map((image) => image.id);
  const followupIds = patients.map((patient) => `demo-fu-${patient.id}`);
  const patientIds = patients.map((patient) => patient.id);
  const userIds = patients.flatMap((patient) => (patient.userId ? [patient.userId] : []));

  await prisma.aIResult.deleteMany({ where: { imageId: { in: imageIds } } });
  await prisma.aITask.deleteMany({ where: { imageId: { in: imageIds } } });
  await prisma.diagnosisReport.deleteMany({ where: { followupId: { in: followupIds } } });
  await prisma.image.deleteMany({ where: { id: { in: imageIds } } });
  await prisma.followUp.deleteMany({ where: { id: { in: followupIds } } });
  await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function ensureDoctor() {
  await prisma.user.upsert({
    where: { id: "doctor-1" },
    update: {
      role: "doctor",
      status: "active",
      account: "doctor",
      phone: "13800000000",
      name: "Dr. Lin",
      passwordHash: "Doctor123!"
    },
    create: {
      id: "doctor-1",
      role: "doctor",
      status: "active",
      account: "doctor",
      phone: "13800000000",
      name: "Dr. Lin",
      passwordHash: "Doctor123!"
    }
  });
}

async function createPatient(patient) {
  if (patient.userId) {
    await prisma.user.create({
      data: {
        id: patient.userId,
        role: "patient",
        status: "active",
        account: patient.phone,
        phone: patient.phone,
        name: patient.name,
        passwordHash: "Patient123!"
      }
    });
  }

  await prisma.patient.create({
    data: {
      id: patient.id,
      userId: patient.userId,
      name: patient.name,
      gender: patient.gender,
      birthDate: dateAtUtc(patient.birthDate),
      phone: patient.phone,
      stomaDate: dateAtUtc(patient.stomaDate),
      stomaType: patient.stomaType,
      medicalRecordNo: patient.medicalRecordNo,
      profileSource: patient.userId ? "patient_registered" : "doctor_created"
    }
  });
}

async function createFollowupWithImages(patient, rows) {
  const followupId = `demo-fu-${patient.id}`;
  const details = categoryDetails[patient.category];
  const followupDate = dateAtUtc("2026-05-20");

  await prisma.followUp.create({
    data: {
      id: followupId,
      patientId: patient.id,
      followupDate,
      status: "completed",
      source: patient.userId ? "patient_upload" : "doctor_upload"
    }
  });

  await Promise.all(
    rows.map(async (row, index) => {
      const source = path.join(sampleRoot, row.expected, row.filename);
      const storageKey = `${patient.id}-${index + 1}-${row.filename}`;
      const destination = path.join(uploadRoot, storageKey);
      await copyFile(source, destination);

      const imageId = `demo-img-${patient.id}-${index + 1}`;
      await prisma.image.create({
        data: {
          id: imageId,
          followupId,
          shotDate: followupDate,
          positionType:
            index === 0 ? "sitting_front" : index === 1 ? "sitting_side" : "supine",
          storageKey,
          fileUrl: destination,
          originalFilename: row.filename,
          uploadedByUserId: patient.userId
        }
      });

      await prisma.aITask.create({
        data: {
          id: `demo-ai-task-${patient.id}-${index + 1}`,
          imageId,
          triggerSource: "auto",
          status: "succeeded",
          retryCount: 0,
          providerTaskId: `demo-provider-${patient.id}-${index + 1}`,
          startedAt: new Date(),
          finishedAt: new Date()
        }
      });

      await prisma.aIResult.create({
        data: {
          id: `demo-ai-result-${patient.id}-${index + 1}`,
          imageId,
          category: row.predicted,
          label: null,
          confidence: row.confidence,
          labelsVersion: "demo-mock",
          rawResultJson: JSON.stringify({
            demo: true,
            expected: row.expected,
            predicted: row.predicted,
            confidence: row.confidence,
            binaryHasComplication: row.binaryHasComplication,
            binaryProbability: row.binaryProbability
          }),
          isCurrent: true
        }
      });
    })
  );

  await prisma.diagnosisReport.create({
    data: {
      id: `demo-report-${patient.id}`,
      followupId,
      hasComplication: details.hasComplication,
      complicationTypes: JSON.stringify(details.complicationTypes),
      severityGrade: details.severityGrade,
      doctorComment: details.comment,
      reviewedByUserId: "doctor-1",
      reviewedAt: new Date(),
      status: "finalized"
    }
  });
}

async function main() {
  await mkdir(uploadRoot, { recursive: true });
  const manifestRows = await readManifest();
  await clearDemoData();
  await ensureDoctor();

  for (const patient of patients) {
    await createPatient(patient);
    const rows = manifestRows
      .filter((row) => row.expected === patient.category)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 1);
    if (rows.length < 1) {
      throw new Error(`Not enough demo samples for ${patient.category}`);
    }
    await createFollowupWithImages(patient, rows);
  }

  console.log(`Seeded ${patients.length} demo patients with ${patients.length} images.`);
  console.log("Doctor login: account=doctor password=Doctor123!");
  console.log("Patient demo login: phone=13910000001 or 13910000002 password=Patient123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
