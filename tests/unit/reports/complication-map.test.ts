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
});
