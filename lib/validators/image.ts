import { z } from "zod";

export const imagePositionSchema = z.enum([
  "sitting_front",
  "sitting_side",
  "supine"
]);

export const imageUploadMetadataSchema = z.object({
  shotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD"),
  positionType: imagePositionSchema,
  patientId: z.string().optional()
});

export type ImageUploadMetadata = z.infer<typeof imageUploadMetadataSchema>;

export function isSupportedImageFile(file: File) {
  return file.type.startsWith("image/");
}
