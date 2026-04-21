const statusLabel = {
  queued: "AI 排队中",
  running: "AI 分析中",
  succeeded: "AI 已完成",
  failed: "AI 失败"
} as const;

export function AiStatusBadge({
  status
}: {
  status: keyof typeof statusLabel;
}) {
  return (
    <span className={`pill ${status === "succeeded" ? "" : "warn"}`}>
      {statusLabel[status]}
    </span>
  );
}
