import Link from "next/link";
import type { Route } from "next";
import { listHydratedFollowupsForPatient } from "@/lib/followups/service";
import { getPatientById } from "@/lib/patients/service";

const stomaTypeLabel = {
  ileostomy: "回肠造口",
  colostomy: "结肠造口"
} as const;

export default async function DoctorPatientDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatientById(id);

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

  const followups = await listHydratedFollowupsForPatient(patient.id);

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">Patient Detail</p>
          <h1 className="page-title">{patient.name}</h1>
          <p className="page-intro">
            当前先展示档案详情占位，下一步会接入随访时间轴、影像列表和 AI / 人工判读入口。
          </p>
        </div>
        <Link className="button-secondary" href="/doctor/patients">
          返回患者列表
        </Link>
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
          </div>
        </article>
        <article className="portal-panel">
          <p className="eyebrow">Next Step</p>
          <h2>随访入口</h2>
          <div className="timeline-stack" style={{ marginTop: 16 }}>
            {followups.length === 0 ? (
              <div className="timeline-card">
                <h3>还没有随访</h3>
                <p className="muted">患者上传首张图片后，这里会出现随访时间轴。</p>
              </div>
            ) : (
              followups.map((followup) => (
                <div key={followup.id} className="timeline-card">
                  <h3>{followup.followupDate}</h3>
                  <p className="muted">
                    已归档 {followup.imageCount} 张影像，状态 {followup.status}
                  </p>
                  <Link
                    className="auth-link"
                    href={`/doctor/followups/${followup.id}` as Route}
                    style={{ marginTop: 10, display: "inline-flex" }}
                  >
                    进入随访详情
                  </Link>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
