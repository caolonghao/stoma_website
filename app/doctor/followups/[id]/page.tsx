import Link from "next/link";
import { ReportForm } from "@/components/doctor/report-form";
import { AiStatusBadge } from "@/components/shared/ai-status-badge";
import { RetryAiButton } from "@/components/doctor/retry-ai-button";
import { getAiSnapshotForImage } from "@/lib/ai/service";
import { getFollowUpById } from "@/lib/followups/service";
import { listImagesForFollowup } from "@/lib/images/service";
import { getReportByFollowupId } from "@/lib/reports/service";

const positionLabel: Record<string, string> = {
  sitting_front: "端坐正位",
  sitting_side: "端坐侧位",
  supine: "平卧位"
};

export default async function DoctorFollowupDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const followup = await getFollowUpById(id);

  if (!followup) {
    return (
      <main className="portal-shell">
        <section className="portal-panel">
          <p className="eyebrow">Doctor Follow-up</p>
          <h1 className="page-title">未找到这次随访</h1>
          <Link className="auth-link" href="/doctor/patients">
            返回患者列表
          </Link>
        </section>
      </main>
    );
  }

  const images = await listImagesForFollowup(followup.id);
  const report = await getReportByFollowupId(followup.id);
  const imageCards = await Promise.all(
    images.map(async (image) => ({
      image,
      ...(await getAiSnapshotForImage(image.id, { syncIfPending: true }))
    }))
  );
  const aiCategories = Array.from(
    new Set(
      imageCards
        .map((item) => item.aiResult?.category)
        .filter((value): value is string => Boolean(value))
    )
  );

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">Doctor Follow-up</p>
          <h1 className="page-title">影像复核与人工判读</h1>
          <p className="page-subtitle">随访日期 {followup.followupDate}</p>
          <p className="page-intro">
            这里汇总单张图像的 AI 辅助状态。当前 AI 只返回 category 粒度，最终细分类仍由医生人工判读。
          </p>
        </div>
        <Link className="button-secondary" href="/doctor/patients">
          返回患者列表
        </Link>
      </header>

      <section className="portal-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Image Review</p>
            <h2>影像与 AI 状态</h2>
          </div>
          <span className="pill warn">{images.length} 张影像</span>
        </div>
        <div className="image-review-grid" style={{ marginTop: 16 }}>
          {imageCards.map(({ image, aiTask, aiResult }) => (
            <article key={image.id} className="review-image-card">
              <div className="panel-heading">
                <strong>{positionLabel[image.positionType] ?? image.positionType}</strong>
                <AiStatusBadge status={aiTask?.status ?? "queued"} />
              </div>
              <p className="muted" style={{ margin: "10px 0 0" }}>
                文件：{image.originalFilename}
              </p>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                AI 分类结果：{aiResult?.category ?? "尚无结果"}
              </p>
              {aiTask ? <RetryAiButton taskId={aiTask.id} /> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="portal-panel" style={{ marginTop: 18 }}>
        <ReportForm
          aiCategories={aiCategories}
          followupId={followup.id}
          initialReport={
            report
              ? {
                  hasComplication: report.hasComplication,
                  complicationTypes: report.complicationTypes,
                  severityGrade: report.severityGrade,
                  doctorComment: report.doctorComment,
                  status: report.status
                }
              : null
          }
        />
      </section>
    </main>
  );
}
