"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { PatientOverviewRecord } from "@/lib/patients/service";

const stomaTypeLabel = {
  ileostomy: "回肠造口",
  colostomy: "结肠造口"
} satisfies Record<PatientOverviewRecord["stomaType"], string>;

const genderLabel = {
  male: "男",
  female: "女",
  unknown: "未标注"
} satisfies Record<PatientOverviewRecord["gender"], string>;

const positionLabel = {
  sitting_front: "端坐正位",
  sitting_side: "端坐侧位",
  supine: "平卧位"
} as const;

export function PatientListPanel({ patients }: { patients: PatientOverviewRecord[] }) {
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(
    patients[0]?.id ?? null
  );

  function togglePatient(id: string) {
    setExpandedPatientId((current) => (current === id ? null : id));
  }

  return (
    <section className="portal-panel panel-surface">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Patient Ledger</p>
          <h2>患者列表</h2>
        </div>
        <span className="pill">共 {patients.length} 位患者</span>
      </div>

      <div className="patient-grid" style={{ marginTop: 16 }}>
        {patients.map((patient) => (
          <article key={patient.id} className="patient-card patient-record-card">
            <div className="patient-card-main">
              <div className="patient-card-topline">
                <div>
                  <strong>{patient.name}</strong>
                  <p className="muted patient-subline">
                    {genderLabel[patient.gender]} · {stomaTypeLabel[patient.stomaType]}
                  </p>
                </div>
                <button
                  aria-expanded={expandedPatientId === patient.id}
                  className="button-secondary"
                  onClick={() => togglePatient(patient.id)}
                  type="button"
                >
                  {expandedPatientId === patient.id ? "收起档案" : "展开档案"}
                </button>
              </div>
              <div className="clinical-meta">
                <span>病历号 {patient.medicalRecordNo}</span>
                <span>造口日期 {patient.stomaDate ?? "待补充"}</span>
                <span>随访 {patient.followupCount} 次</span>
                <span>影像 {patient.totalImageCount} 张</span>
                <span>最近随访 {patient.latestFollowupDate ?? "暂无"}</span>
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

            {expandedPatientId === patient.id ? (
              <div className="patient-record-detail">
                <div className="patient-detail-grid">
                  <div className="timeline-card">
                    <h3>档案摘要</h3>
                    <div className="clinical-meta">
                      <span>出生日期 {patient.birthDate ?? "未补充"}</span>
                      <span>创建方式 {patient.profileSource === "doctor_created" ? "医生建档" : "患者注册"}</span>
                      <span>更新时间 {patient.updatedAt.slice(0, 10)}</span>
                    </div>
                  </div>
                  <div className="timeline-card">
                    <h3>快捷操作</h3>
                    <div className="action-row" style={{ marginTop: 10 }}>
                      <Link className="button-secondary" href={`/doctor/patients/${patient.id}` as Route}>
                        完整档案
                      </Link>
                      {patient.followups[0] ? (
                        <Link
                          className="button-primary"
                          href={`/doctor/followups/${patient.followups[0].id}` as Route}
                        >
                          最近随访
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="followup-disclosure-stack">
                  {patient.followups.length === 0 ? (
                    <div className="timeline-card">
                      <h3>还没有随访</h3>
                      <p className="muted">患者上传首张图片后，这里会直接展开显示影像与报告状态。</p>
                    </div>
                  ) : (
                    patient.followups.map((followup) => (
                      <details key={followup.id} className="followup-disclosure" open={patient.followups[0]?.id === followup.id}>
                        <summary className="followup-summary">
                          <div>
                            <strong>{followup.followupDate}</strong>
                            <p className="muted">
                              {followup.status} · {followup.imageCount} 张影像
                            </p>
                          </div>
                          <span className={`pill ${followup.report?.status === "finalized" ? "" : "warn"}`}>
                            {followup.report?.conclusion ?? "待判读"}
                          </span>
                        </summary>
                        <div className="followup-body">
                          <div className="clinical-meta">
                            <span>体位 {followup.positions.map((position) => positionLabel[position as keyof typeof positionLabel] ?? position).join("、")}</span>
                            <span>报告状态 {followup.report?.status ?? "未提交"}</span>
                            <span>分级 {followup.report?.severityGrade ?? "无"}</span>
                          </div>
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
                          {followup.report ? (
                            <div className="timeline-card">
                              <h3>医生结论</h3>
                              <p className="muted">{followup.report.conclusion}</p>
                              <p className="muted" style={{ marginTop: 8 }}>
                                {followup.report.doctorComment || "暂无补充意见"}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
