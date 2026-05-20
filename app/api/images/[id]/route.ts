import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserFromRequest } from "@/lib/auth/http";
import { getPatientByUserId } from "@/lib/patients/service";

function inferContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const image = await prisma.image.findUnique({
    where: { id },
    include: {
      followup: {
        select: {
          patientId: true
        }
      }
    }
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (user.role === "patient") {
    const patient = await getPatientByUserId(user.sub);
    if (!patient || patient.id !== image.followup.patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const buffer = await readFile(image.fileUrl);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": inferContentType(image.fileUrl),
      "cache-control": "private, max-age=60"
    }
  });
}
