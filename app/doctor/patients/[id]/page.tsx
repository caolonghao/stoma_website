import Link from "next/link";
import type { Route } from "next";
import { LogoutButton } from "@/components/shared/logout-button";
import { getPatientOverviewById } from "@/lib/patients/service";

const stomaTypeLabel = {
  ileostomy: "回肠造口",
  colostomy: "结肠造口"
} as const;

const positionLabel = {
  sitting_front: "端坐正位",
  sitting_side: "端坐侧位",
  supine: "平卧位"
} as const;

export default async function DoctorPatientDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatientOverviewById(id);

  if (!patient) {
    return (
      <main className="portal-shell">
        <section className="portal-panel">
          <p className="eyebrow">Patient Detail</p>
          <h1 className="page-title">未找到患者</h1>
          <p className="hero-copy">这个患者 ID 当前不存在，可能还没有完成建档。</p>
          <Link className="auth-link" href="/doctor/patients">
            返回患者列表
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">Patient Detail</p>
          <h1 className="page-title">患者档案与随访节奏</h1>
          <p className="page-subtitle">{patient.name}</p>
          <p className="page-intro">
            当前先展示档案详情占位，下一步会接入随访时间轴、影像列表和 AI / 人工判读入口。
          </p>
        </div>
        <div className="header-actions">
          <Link className="button-secondary" href="/doctor/patients">
            返回患者列表
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section className="two-column">
        <article className="portal-panel">
          <p className="eyebrow">Profile</p>
          <h2>基础资料</h2>
          <div className="timeline-stack" style={{ marginTop: 16 }}>
            <div className="timeline-card">
              <h3>病历号</h3>
              <p className="muted">{patient.medicalRecordNo}</p>
            </div>
            <div className="timeline-card">
              <h3>造口类型</h3>
              <p className="muted">{stomaTypeLabel[patient.stomaType]}</p>
            </div>
            <div className="timeline-card">
              <h3>手机号</h3>
              <p className="muted">{patient.phone ?? "未留存"}</p>
            </div>
            <div className="timeline-card">
              <h3>随访次数</h3>
              <p className="muted">{patient.followupCount} 次</p>
            </div>
          </div>
        </article>
        <article className="portal-panel">
          <p className="eyebrow">Follow-up Archive</p>
          <h2>影像与随访档案</h2>
          <div className="timeline-stack" style={{ marginTop: 16 }}>
            {patient.followups.length === 0 ? (
              <div className="timeline-card">
                <h3>还没有随访</h3>
                <p className="muted">患者上传首张图片后，这里会出现随访时间轴。</p>
              </div>
            ) : (
              patient.followups.map((followup) => (
                <details key={followup.id} className="followup-disclosure" open>
                  <summary className="followup-summary">
                    <div>
                      <strong>{followup.followupDate}</strong>
                      <p className="muted">
                        已归档 {followup.imageCount} 张影像，状态 {followup.status}
                      </p>
                    </div>
                    <span className={`pill ${followup.report?.status === "finalized" ? "" : "warn"}`}>
                      {followup.report?.conclusion ?? "待判读"}
                    </span>
                  </summary>
                  <div className="followup-body">
                    <div className="inline-image-grid">
                      {followup.images.map((image) => (
                        <figure key={image.id} className="inline-image-card">
                          <img
                            alt={`${followup.followupDate} ${positionLabel[image.positionType]}`}
                            className="inline-image"
                            loading="lazy"
                            src={image.browserUrl}
                          />
                          <figcaption>
                            <strong>{positionLabel[image.positionType]}</strong>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                    <div className="clinical-meta">
                      <span>
                        体位
                        {" "}
                        {followup.positions
                          .map((position) => positionLabel[position as keyof typeof positionLabel] ?? position)
                          .join("、")}
                      </span>
                      <span>报告状态 {followup.report?.status ?? "未提交"}</span>
                    </div>
                    <p className="muted" style={{ marginTop: 10 }}>
                      {followup.report?.doctorComment || "当前还没有医生补充意见。"}
                    </p>
                    <Link
                      className="auth-link"
                      href={`/doctor/followups/${followup.id}` as Route}
                      style={{ marginTop: 10, display: "inline-flex" }}
                    >
                      进入随访详情
                    </Link>
                  </div>
                </details>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
