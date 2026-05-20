import { describe, expect, it } from "vitest";
import {
  complicationCategoryMap,
  getComplicationOptionsForCategories
} from "@/lib/reports/complication-map";

describe("complication category mapping", () => {
  it("maps skin complications to the expected detailed types", () => {
    expect(complicationCategoryMap["周围皮肤并发症"]).toContain("刺激性皮炎");
    expect(complicationCategoryMap["周围皮肤并发症"]).toContain("毛囊炎");
  });

  it("narrows options to the matching ai categories", () => {
    const narrowed = getComplicationOptionsForCategories([
      "腹壁隧道并发症",
      "正常"
    ]);

    expect(Object.keys(narrowed)).toEqual(["腹壁隧道并发症"]);
    expect(narrowed["腹壁隧道并发症"]).toContain("造口回缩");
  });

  it("treats normal as no-complication and excludes it from selectable complication categories", () => {
    const narrowed = getComplicationOptionsForCategories(["正常"]);

    expect(Object.keys(narrowed)).toEqual([
      "肠管及系膜并发症",
      "腹壁切口并发症",
      "腹壁隧道并发症",
      "周围皮肤并发症"
    ]);
    expect(narrowed).not.toHaveProperty("正常");
  });
});
