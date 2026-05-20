import { describe, expect, it } from "vitest";
import { formatAiCategoryLabel } from "@/lib/reports/category-label";

describe("formatAiCategoryLabel", () => {
  it("maps normal to a no-complication label", () => {
    expect(formatAiCategoryLabel("正常")).toBe("正常（无并发症）");
  });

  it("keeps complication categories unchanged", () => {
    expect(formatAiCategoryLabel("腹壁隧道并发症")).toBe("腹壁隧道并发症");
  });

  it("falls back when no category is available", () => {
    expect(formatAiCategoryLabel(undefined, "正在分析")).toBe("正在分析");
  });
});
