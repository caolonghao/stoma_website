import Link from "next/link";
import type { Route } from "next";

type FollowUpListItem = {
  id: string;
  followupDate: string;
  status: "pending_ai" | "pending_review" | "completed";
  imageCount: number;
  positions: string[];
};

const statusLabel = {
  pending_ai: "AI 分析中",
  pending_review: "待医生判读",
  completed: "已完成"
} satisfies Record<FollowUpListItem["status"], string>;

const positionLabel: Record<string, string> = {
  sitting_front: "端坐正位",
  sitting_side: "端坐侧位",
  supine: "平卧位"
};

export function FollowupList({ followups }: { followups: FollowUpListItem[] }) {
  if (followups.length === 0) {
    return (
      <article className="timeline-card">
        <h3>还没有随访记录</h3>
        <p className="muted" style={{ marginTop: 10 }}>
          上传第一张影像后，系统会自动按拍摄日期创建一次随访。
        </p>
      </article>
    );
  }

  return (
    <div className="timeline-stack">
      {followups.map((item) => (
        <article key={item.id} className="timeline-card">
          <p className="eyebrow">{item.followupDate}</p>
          <div className="panel-heading">
            <h3>{statusLabel[item.status]}</h3>
            <span className={`pill ${item.status === "completed" ? "" : "warn"}`}>
              {item.imageCount} 张影像
            </span>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            本次随访已收录：
            {" "}
            {item.positions.map((position) => positionLabel[position] ?? position).join("、")}
          </p>
          <Link
            className="auth-link"
            href={`/patient/followups/${item.id}` as Route}
            style={{ marginTop: 12, display: "inline-flex" }}
          >
            查看本次随访
          </Link>
        </article>
      ))}
    </div>
  );
}
