import Link from "next/link";
import type { Route } from "next";
import type { PatientRecord } from "@/lib/patients/service";

const stomaTypeLabel = {
  ileostomy: "回肠造口",
  colostomy: "结肠造口"
} satisfies Record<PatientRecord["stomaType"], string>;

const genderLabel = {
  male: "男",
  female: "女",
  unknown: "未标注"
} satisfies Record<PatientRecord["gender"], string>;

export function PatientListPanel({ patients }: { patients: PatientRecord[] }) {
  return (
    <section className="portal-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Patient Ledger</p>
          <h2>患者列表</h2>
        </div>
        <span className="pill">共 {patients.length} 位患者</span>
      </div>

      <div className="patient-grid" style={{ marginTop: 16 }}>
        {patients.map((patient) => (
          <article key={patient.id} className="patient-card">
            <div className="patient-card-main">
              <div>
                <strong>{patient.name}</strong>
                <p className="muted patient-subline">
                  {genderLabel[patient.gender]} · {stomaTypeLabel[patient.stomaType]}
                </p>
              </div>
              <div className="patient-metrics">
                <span>病历号 {patient.medicalRecordNo}</span>
                <span>造口日期 {patient.stomaDate ?? "待补充"}</span>
              </div>
            </div>
            <div className="patient-card-side">
              <span className="pill">{patient.phone ?? "未留手机号"}</span>
              <Link
                className="auth-link"
                href={`/doctor/patients/${patient.id}` as Route}
              >
                查看详情
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
