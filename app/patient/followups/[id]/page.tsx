import Link from "next/link";
import { ReportSummary } from "@/components/patient/report-summary";
import { AiStatusBadge } from "@/components/shared/ai-status-badge";
import { LogoutButton } from "@/components/shared/logout-button";
import { getAiSnapshotForImage } from "@/lib/ai/service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFollowUpById } from "@/lib/followups/service";
import { listImagesForFollowup } from "@/lib/images/service";
import { getPatientByUserId } from "@/lib/patients/service";
import { formatAiCategoryLabel } from "@/lib/reports/category-label";
import { getReportByFollowupId } from "@/lib/reports/service";

const positionLabel: Record<string, string> = {
  sitting_front: "端坐正位",
  sitting_side: "端坐侧位",
  supine: "平卧位"
};

export default async function PatientFollowupDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const patient = user ? await getPatientByUserId(user.sub) : null;
  const followup = await getFollowUpById(id);

  if (!patient || !followup || followup.patientId !== patient.id) {
    return (
      <main className="portal-shell">
        <section className="portal-panel">
          <p className="eyebrow">Follow-up Detail</p>
          <h1 className="page-title">无法查看这次随访</h1>
          <p className="hero-copy">请先确认你已经登录对应患者账号，或返回随访列表重新进入。</p>
          <Link className="auth-link" href="/patient/dashboard">
            返回我的随访
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

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">Follow-up Detail</p>
          <h1 className="page-title">随访影像与医生结论</h1>
          <p className="page-subtitle">随访日期 {followup.followupDate}</p>
          <p className="page-intro">
            当前展示的是这次随访已归档的图片。下一步会继续接入 AI 状态和医生最终综合报告。
          </p>
        </div>
        <div className="header-actions">
          <Link className="button-secondary" href="/patient/dashboard">
            返回我的随访
          </Link>
          <LogoutButton />
        </div>
      </header>
      <section className="portal-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Archived Images</p>
            <h2>本次已上传影像</h2>
          </div>
          <span className="pill warn">{images.length} 张</span>
        </div>
        <div className="image-board" style={{ marginTop: 16 }}>
          {imageCards.map(({ image, aiTask, aiResult }) => (
            <article key={image.id} className="image-tile image-tile-detailed">
              <div className="panel-heading" style={{ alignItems: "center" }}>
                <strong>{positionLabel[image.positionType] ?? image.positionType}</strong>
                <AiStatusBadge status={aiTask?.status ?? "queued"} />
              </div>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                上传文件：{image.originalFilename}
              </p>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                AI 分类：{formatAiCategoryLabel(aiResult?.category, "正在分析")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-panel" style={{ marginTop: 18 }}>
        <ReportSummary report={report} />
      </section>
    </main>
  );
}
