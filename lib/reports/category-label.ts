export function formatAiCategoryLabel(
  category: string | null | undefined,
  fallback = "尚无结果"
) {
  if (!category) {
    return fallback;
  }

  if (category === "正常") {
    return "正常（无并发症）";
  }

  return category;
}
