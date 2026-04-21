import Link from "next/link";
import { FollowupList } from "@/components/patient/followup-list";
import { UploadImageForm } from "@/components/patient/upload-image-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listHydratedFollowupsForPatient } from "@/lib/followups/service";
import { getPatientByUserId } from "@/lib/patients/service";

export default async function PatientDashboardPage() {
  const user = await getCurrentUser();
  const patient = user ? await getPatientByUserId(user.sub) : null;
  const followups = patient ? await listHydratedFollowupsForPatient(patient.id) : [];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">Patient Workspace</p>
          <h1 className="page-title">我的随访</h1>
          <p className="page-intro">
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
              <h3>患者档案暂未就绪</h3>
              <p className="muted" style={{ marginTop: 10 }}>
                当前账号还没有关联到患者档案，暂时无法展示属于你的随访记录。
              </p>
              <Link className="auth-link" href="/" style={{ marginTop: 12, display: "inline-flex" }}>
                返回首页
              </Link>
            </article>
          )}
        </div>
        <aside className="portal-panel">
          {patient ? (
            <UploadImageForm />
          ) : (
            <article className="upload-card">
              <p className="eyebrow">Profile Pending</p>
              <h3>档案建立后才可上传</h3>
              <p className="muted">上传接口依赖患者身份绑定，档案未准备好时系统不会接收图片。</p>
            </article>
          )}
        </aside>
      </section>
    </main>
  );
}
