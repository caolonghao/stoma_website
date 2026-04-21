import Link from "next/link";
import { FollowupList } from "@/components/patient/followup-list";
import { UploadImageForm } from "@/components/patient/upload-image-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listHydratedFollowupsForPatient } from "@/lib/followups/service";
import { getPatientByUserId } from "@/lib/patients/service";

export default async function PatientDashboardPage() {
  const user = await getCurrentUser();
  const patient = user ? await getPatientByUserId(user.sub) : null;
  const followups = patient
    ? await listHydratedFollowupsForPatient(patient.id)
    : [];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">Patient Workspace</p>
          <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.8rem)" }}>我的随访</h1>
          <p style={{ marginTop: 12 }}>
            患者端第一版先聚焦上传与查看，尽量少制造压力，只保留当前真正需要的信息。
          </p>
        </div>
      </header>
      <section className="portal-grid">
        <div className="portal-panel">
          <h2>随访记录</h2>
          {patient ? (
            <FollowupList followups={followups} />
          ) : (
            <article className="timeline-card">
              <h3>需要先登录患者账号</h3>
              <p className="muted" style={{ marginTop: 10 }}>
                登录后系统才能识别你的患者档案，并展示只属于你的随访记录。
              </p>
              <Link className="auth-link" href="/login" style={{ marginTop: 12, display: "inline-flex" }}>
                去登录
              </Link>
            </article>
          )}
        </div>
        <aside className="portal-panel">
          {patient ? (
            <UploadImageForm />
          ) : (
            <article className="upload-card">
              <p className="eyebrow">Sign In Required</p>
              <h3>登录后才能上传</h3>
              <p className="muted">上传接口依赖当前患者身份，未登录时系统不会接收图片。</p>
            </article>
          )}
        </aside>
      </section>
    </main>
  );
}
