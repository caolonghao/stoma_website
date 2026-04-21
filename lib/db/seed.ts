import { prisma } from "@/lib/db/prisma";

async function upsertDoctor() {
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

async function upsertDefaultPatient() {
  await prisma.user.upsert({
    where: { id: "patient-1" },
    update: {
      role: "patient",
      status: "active",
      account: "13800000010",
      phone: "13800000010",
      name: "王敏",
      passwordHash: "Patient123!"
    },
    create: {
      id: "patient-1",
      role: "patient",
      status: "active",
      account: "13800000010",
      phone: "13800000010",
      name: "王敏",
      passwordHash: "Patient123!"
    }
  });

  await prisma.patient.upsert({
    where: { id: "pat-1001" },
    update: {
      userId: "patient-1",
      name: "王敏",
      gender: "female",
      birthDate: new Date("1980-07-10"),
      phone: "13800000010",
      stomaDate: new Date("2026-04-20"),
      stomaType: "colostomy",
      medicalRecordNo: "MRN-1010",
      profileSource: "patient_registered"
    },
    create: {
      id: "pat-1001",
      userId: "patient-1",
      name: "王敏",
      gender: "female",
      birthDate: new Date("1980-07-10"),
      phone: "13800000010",
      stomaDate: new Date("2026-04-20"),
      stomaType: "colostomy",
      medicalRecordNo: "MRN-1010",
      profileSource: "patient_registered"
    }
  });
}

async function upsertDoctorCreatedPatients() {
  await prisma.patient.upsert({
    where: { id: "pat-1002" },
    update: {
      name: "张磊",
      gender: "male",
      birthDate: new Date("1975-03-21"),
      phone: "13800000011",
      stomaDate: new Date("2026-04-19"),
      stomaType: "ileostomy",
      medicalRecordNo: "MRN-1011",
      profileSource: "doctor_created"
    },
    create: {
      id: "pat-1002",
      name: "张磊",
      gender: "male",
      birthDate: new Date("1975-03-21"),
      phone: "13800000011",
      stomaDate: new Date("2026-04-19"),
      stomaType: "ileostomy",
      medicalRecordNo: "MRN-1011",
      profileSource: "doctor_created"
    }
  });

  await prisma.patient.upsert({
    where: { id: "pat-1003" },
    update: {
      name: "陈洁",
      gender: "female",
      birthDate: new Date("1988-11-08"),
      phone: "13800000012",
      stomaDate: new Date("2026-04-18"),
      stomaType: "colostomy",
      medicalRecordNo: "MRN-1012",
      profileSource: "doctor_created"
    },
    create: {
      id: "pat-1003",
      name: "陈洁",
      gender: "female",
      birthDate: new Date("1988-11-08"),
      phone: "13800000012",
      stomaDate: new Date("2026-04-18"),
      stomaType: "colostomy",
      medicalRecordNo: "MRN-1012",
      profileSource: "doctor_created"
    }
  });
}

export async function ensureCoreData() {
  await upsertDoctor();
  await upsertDefaultPatient();
  await upsertDoctorCreatedPatients();
}

export async function resetDatabase() {
  await prisma.aIResult.deleteMany();
  await prisma.aITask.deleteMany();
  await prisma.diagnosisReport.deleteMany();
  await prisma.image.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
}
