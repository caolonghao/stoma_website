import { z } from "zod";

export const patientGenderSchema = z.enum(["male", "female", "unknown"]);
export const patientStomaTypeSchema = z.enum(["ileostomy", "colostomy"]);

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const optionalDate = emptyToUndefined(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
);

const optionalPhone = emptyToUndefined(
  z.string().regex(/^1\d{10}$/, "请输入有效手机号")
);

export const createPatientSchema = z.object({
  name: z.string().min(2, "姓名至少 2 个字符"),
  gender: patientGenderSchema,
  birthDate: optionalDate,
  phone: optionalPhone,
  stomaDate: optionalDate,
  stomaType: patientStomaTypeSchema,
  medicalRecordNo: z.string().min(3, "请输入病历号")
});

export const patientSearchSchema = z.object({
  name: emptyToUndefined(z.string()),
  gender: emptyToUndefined(patientGenderSchema),
  birthDate: optionalDate,
  phone: emptyToUndefined(z.string()),
  stomaDate: optionalDate,
  stomaType: emptyToUndefined(patientStomaTypeSchema),
  medicalRecordNo: emptyToUndefined(z.string())
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type PatientSearchInput = z.infer<typeof patientSearchSchema>;
