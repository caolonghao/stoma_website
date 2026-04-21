import { CreatePatientForm } from "@/components/doctor/create-patient-form";
import { PatientListPanel } from "@/components/doctor/patient-list-panel";
import { PatientSearchForm } from "@/components/doctor/patient-search-form";
import { listPatients } from "@/lib/patients/service";
import { patientSearchSchema } from "@/lib/validators/patient";

type DoctorPatientsPageProps = {
  searchParams?: Promise<{
    name?: string;
    gender?: string;
    birthDate?: string;
    phone?: string;
    stomaDate?: string;
    stomaType?: string;
    medicalRecordNo?: string;
  }>;
};

export default async function DoctorPatientsPage({
  searchParams
}: DoctorPatientsPageProps) {
  const rawFilters = (await searchParams) ?? {};
  const filters = patientSearchSchema.parse(rawFilters);
  const patients = await listPatients(filters);
  const stats = [
    { label: "Active Files", value: String(patients.length) },
    {
      label: "Colostomy",
      value: String(patients.filter((item) => item.stomaType === "colostomy").length)
    },
    {
      label: "Ileostomy",
      value: String(patients.filter((item) => item.stomaType === "ileostomy").length)
    }
  ];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">Doctor Workspace</p>
          <h1 className="page-title">患者检索与总览</h1>
          <p className="page-intro">
            这一页已经接入真实的患者建档与组合检索服务，下一步会继续接患者详情与随访时间轴。
          </p>
        </div>
      </header>
      <section className="portal-grid">
        <div className="portal-panel">
          <h2>今日节奏</h2>
          <div className="stats-grid">
            {stats.map((item) => (
              <article key={item.label} className="stat-card">
                <p className="eyebrow">{item.label}</p>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
          <div className="portal-stack">
            <PatientSearchForm search={filters} />
            <PatientListPanel patients={patients} />
          </div>
        </div>
        <aside className="portal-panel">
          <p className="eyebrow">Create & Notes</p>
          <h2>建档与系统策略</h2>
          <CreatePatientForm />
          <div className="timeline-stack">
            <article className="timeline-card">
              <h3>JWT 已就位</h3>
              <p className="muted">医生端 API 现在都建立在 Bearer Token 上，等我们补 middleware 时会把本地存储 token 改成更稳的 cookie 流。</p>
            </article>
            <article className="timeline-card">
              <h3>本地存储优先</h3>
              <p className="muted">文件上传后续先落本地目录，保持接口稳定，方便后面切换到 S3。</p>
            </article>
          </div>
        </aside>
      </section>
    </main>
  );
}
