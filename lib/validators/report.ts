import { z } from "zod";
import { allComplicationTypes } from "@/lib/reports/complication-map";

export const complicationTypeSchema = z.enum(
  allComplicationTypes as [string, ...string[]]
);

export const reportSeveritySchema = z.enum(["Ia", "Ib", "IIa", "IIb", "III"]);
export const reportStatusSchema = z.enum(["draft", "finalized"]);

export const reportSchema = z
  .object({
    followupId: z.string().min(1),
    hasComplication: z.boolean(),
    complicationTypes: z.array(complicationTypeSchema),
    severityGrade: reportSeveritySchema.nullable(),
    doctorComment: z.string().max(2000).optional().default(""),
    status: reportStatusSchema
  })
  .superRefine((value, ctx) => {
    if (value.hasComplication && value.complicationTypes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["complicationTypes"],
        message: "存在并发症时必须选择并发症类型"
      });
    }

    if (!value.hasComplication && value.complicationTypes.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["complicationTypes"],
        message: "无并发症时不应选择并发症类型"
      });
    }
  });

export type ReportInput = z.infer<typeof reportSchema>;
