export const complicationCategoryMap = {
  肠管及系膜并发症: ["造口水肿", "造口出血", "造口旁瘘", "造口坏死"],
  腹壁切口并发症: ["非感染性愈合不良", "感染性愈合不良"],
  腹壁隧道并发症: ["造口脱垂", "造口回缩", "造口凹陷", "造口狭窄", "造口旁疝"],
  周围皮肤并发症: [
    "刺激性皮炎",
    "过敏性皮炎",
    "真菌性皮炎",
    "撕脱性皮肤损伤",
    "坏疽性脓皮病",
    "黏膜肉芽肿",
    "假疣性增生",
    "毛囊炎"
  ],
  正常: []
} as const;

export type AiCategory = keyof typeof complicationCategoryMap;

export const allComplicationTypes = Array.from(
  new Set(
    Object.entries(complicationCategoryMap)
      .filter(([category]) => category !== "正常")
      .flatMap(([, items]) => items)
  )
);

export function getComplicationOptionsForCategories(categories: string[]) {
  const normalized = Array.from(new Set(categories)).filter(
    (category): category is AiCategory => category in complicationCategoryMap
  );

  if (normalized.length === 0 || normalized.every((category) => category === "正常")) {
    return complicationCategoryMap;
  }

  const filtered = Object.fromEntries(
    normalized
      .filter((category) => category !== "正常")
      .map((category) => [category, complicationCategoryMap[category]])
  ) as Partial<typeof complicationCategoryMap>;

  return filtered;
}
