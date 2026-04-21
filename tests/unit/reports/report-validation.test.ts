import { describe, expect, it } from "vitest";
import { reportSchema } from "@/lib/validators/report";

describe("report validation", () => {
  it("requires complication types when a complication exists", () => {
    const result = reportSchema.safeParse({
      followupId: "followup-1",
      hasComplication: true,
      complicationTypes: [],
      severityGrade: "Ia",
      doctorComment: "needs review",
      status: "draft"
    });

    expect(result.success).toBe(false);
  });

  it("accepts allowed severity grades only", () => {
    const valid = reportSchema.safeParse({
      followupId: "followup-1",
      hasComplication: true,
      complicationTypes: ["刺激性皮炎"],
      severityGrade: "IIb",
      doctorComment: "validated",
      status: "finalized"
    });

    const invalid = reportSchema.safeParse({
      followupId: "followup-1",
      hasComplication: true,
      complicationTypes: ["刺激性皮炎"],
      severityGrade: "IV",
      doctorComment: "invalid",
      status: "finalized"
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
