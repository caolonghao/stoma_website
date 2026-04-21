import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function getUploadDir() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./uploads");
}

export async function saveLocalUpload(file: File) {
  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const extension = path.extname(file.name) || ".bin";
  const storageKey = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadDir, storageKey);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return {
    storageKey,
    absolutePath
  };
}
