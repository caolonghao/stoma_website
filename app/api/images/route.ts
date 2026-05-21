import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/http";
import { getPatientByUserId } from "@/lib/patients/service";
import {
  imageUploadMetadataSchema,
  isSupportedImageFile
} from "@/lib/validators/image";
import { saveLocalUpload } from "@/lib/storage/service";
import { createImageRecord } from "@/lib/images/service";
import { enqueueAiTask } from "@/lib/ai/service";

function isFileLike(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      "arrayBuffer" in value &&
      typeof value.arrayBuffer === "function"
  );
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const fileEntry = formData.get("file");

  if (!isFileLike(fileEntry)) {
    return NextResponse.json({ error: "请选择图片文件" }, { status: 400 });
  }

  if (!isSupportedImageFile(fileEntry)) {
    return NextResponse.json({ error: "仅支持图片文件上传" }, { status: 400 });
  }

  const metadataParse = imageUploadMetadataSchema.safeParse({
    shotDate: formData.get("shotDate"),
    positionType: formData.get("positionType"),
    patientId: formData.get("patientId") ?? undefined
  });

  if (!metadataParse.success) {
    return NextResponse.json(
      { error: metadataParse.error.flatten() },
      { status: 400 }
    );
  }

  let patientId = metadataParse.data.patientId;

  if (user.role === "patient") {
    const patient = await getPatientByUserId(user.sub);
    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    patientId = patient.id;
  }

  if (!patientId) {
    return NextResponse.json({ error: "缺少患者标识" }, { status: 400 });
  }

  const stored = await saveLocalUpload(fileEntry);
  const created = await createImageRecord({
    patientId,
    metadata: metadataParse.data,
    storageKey: stored.storageKey,
    fileUrl: stored.absolutePath,
    originalFilename: fileEntry.name,
    uploadedByUserId: user.sub,
    source: user.role === "doctor" ? "doctor_upload" : "patient_upload"
  });

  const aiTask = await enqueueAiTask({
    imageId: created.image.id,
    imageUrl: created.image.fileUrl,
    originalFilename: created.image.originalFilename,
    triggerSource: "auto"
  });

  return NextResponse.json(
    {
      ...created,
      aiTask
    },
    { status: 201 }
  );
}
