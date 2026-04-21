CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "account" TEXT,
  "phone" TEXT,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "lastLoginAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Patient" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "gender" TEXT NOT NULL DEFAULT 'unknown',
  "birthDate" DATETIME,
  "phone" TEXT,
  "stomaDate" DATETIME,
  "stomaType" TEXT,
  "medicalRecordNo" TEXT,
  "profileSource" TEXT NOT NULL DEFAULT 'doctor_created',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FollowUp" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "followupDate" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending_ai',
  "source" TEXT NOT NULL DEFAULT 'patient_upload',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "FollowUp_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Image" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "followupId" TEXT NOT NULL,
  "shotDate" DATETIME NOT NULL,
  "positionType" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "originalFilename" TEXT,
  "uploadedByUserId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Image_followupId_fkey" FOREIGN KEY ("followupId") REFERENCES "FollowUp" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Image_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AIResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "imageId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "label" TEXT,
  "confidence" REAL,
  "labelsVersion" TEXT,
  "rawResultJson" TEXT NOT NULL,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIResult_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DiagnosisReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "followupId" TEXT NOT NULL,
  "hasComplication" BOOLEAN NOT NULL,
  "complicationTypes" TEXT NOT NULL,
  "severityGrade" TEXT,
  "doctorComment" TEXT,
  "reviewedByUserId" TEXT NOT NULL,
  "reviewedAt" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "DiagnosisReport_followupId_fkey" FOREIGN KEY ("followupId") REFERENCES "FollowUp" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DiagnosisReport_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AITask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "imageId" TEXT NOT NULL,
  "triggerSource" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "requestedByUserId" TEXT,
  "providerTaskId" TEXT,
  "errorMessage" TEXT,
  "startedAt" DATETIME,
  "finishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AITask_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AITask_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_account_key" ON "User"("account");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_userId_key" ON "Patient"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_medicalRecordNo_key" ON "Patient"("medicalRecordNo");
CREATE INDEX IF NOT EXISTS "Patient_name_idx" ON "Patient"("name");
CREATE INDEX IF NOT EXISTS "Patient_phone_idx" ON "Patient"("phone");
CREATE INDEX IF NOT EXISTS "FollowUp_followupDate_idx" ON "FollowUp"("followupDate");
CREATE UNIQUE INDEX IF NOT EXISTS "FollowUp_patientId_followupDate_key" ON "FollowUp"("patientId", "followupDate");
CREATE INDEX IF NOT EXISTS "Image_shotDate_idx" ON "Image"("shotDate");
CREATE INDEX IF NOT EXISTS "AIResult_imageId_isCurrent_idx" ON "AIResult"("imageId", "isCurrent");
CREATE UNIQUE INDEX IF NOT EXISTS "DiagnosisReport_followupId_key" ON "DiagnosisReport"("followupId");
CREATE INDEX IF NOT EXISTS "AITask_imageId_status_idx" ON "AITask"("imageId", "status");
CREATE INDEX IF NOT EXISTS "AITask_providerTaskId_idx" ON "AITask"("providerTaskId");
