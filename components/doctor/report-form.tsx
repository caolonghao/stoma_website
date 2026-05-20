"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getComplicationOptionsForCategories } from "@/lib/reports/complication-map";

const severityOptions = ["Ia", "Ib", "IIa", "IIb", "III"] as const;

type ExistingReport = {
  hasComplication: boolean;
  complicationTypes: string[];
  severityGrade: string | null;
  doctorComment: string;
  status: "draft" | "finalized";
} | null;

export function ReportForm({
  followupId,
  initialReport,
  aiCategories
}: {
  followupId: string;
  initialReport: ExistingReport;
  aiCategories: string[];
}) {
  const router = useRouter();
  const [hasComplication, setHasComplication] = useState(
    initialReport?.hasComplication ?? false
  );
  const [complicationTypes, setComplicationTypes] = useState<string[]>(
    initialReport?.complicationTypes ?? []
  );
  const [severityGrade, setSeverityGrade] = useState<string>(
    initialReport?.severityGrade ?? ""
  );
  const [doctorComment, setDoctorComment] = useState(
    initialReport?.doctorComment ?? ""
  );
  const [status, setStatus] = useState<"draft" | "finalized">(
    initialReport?.status ?? "draft"
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const optionGroups = getComplicationOptionsForCategories(aiCategories);
  const onlyNormalSuggested =
    aiCategories.length > 0 && aiCategories.every((category) => category === "正常");

  function toggleComplication(type: string) {
    setComplicationTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  }

  function switchComplicationState(nextHasComplication: boolean) {
    setHasComplication(nextHasComplication);

    if (!nextHasComplication) {
      setComplicationTypes([]);
      setSeverityGrade("");
    }
  }

  async function submit(nextStatus: "draft" | "finalized") {
    setError("");
    setSuccess("");

    const token = window.localStorage.getItem("stoma_atlas_token");
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        authorization: token ? `Bearer ${token}` : "",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        followupId,
        hasComplication,
        complicationTypes: hasComplication ? complicationTypes : [],
        severityGrade: severityGrade || null,
        doctorComment,
        status: nextStatus
      })
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error ?? "保存报告失败");
      return;
    }

    setStatus(nextStatus);
    setSuccess(nextStatus === "finalized" ? "已提交最终报告" : "草稿已保存");
    startTransition(() => router.refresh());
  }

  return (
    <article className="report-card panel-surface">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Manual Diagnosis</p>
          <h3>人工综合判读与报告提交</h3>
        </div>
        <span className={`pill ${status === "finalized" ? "" : "warn"}`}>
          {status === "finalized" ? "已提交" : "草稿"}
        </span>
      </div>
      <p className="panel-intro">
        结合 AI 分类建议与原始影像，完成最终人工判读。草稿可反复修改，最终提交后患者端即可查看。
      </p>

      <div className="form-grid" style={{ marginTop: 16 }}>
        <div className="field">
          <label>本次人工结论</label>
          <p className="muted" style={{ margin: "0 0 10px" }}>
            无并发症即判定为正常。只有判定为存在并发症时，才进入四类并发症范围内继续细分。
          </p>
          <div className="chip-grid">
            <button
              className={`toggle-chip ${!hasComplication ? "active" : ""}`}
              onClick={() => switchComplicationState(false)}
              type="button"
            >
              正常
            </button>
            <button
              className={`toggle-chip ${hasComplication ? "active" : ""}`}
              onClick={() => switchComplicationState(true)}
              type="button"
            >
              有并发症
            </button>
          </div>
        </div>

        {hasComplication ? (
          <>
            <div className="field">
              <label>并发症分类与类型</label>
              <p className="muted" style={{ margin: "0 0 10px" }}>
                {onlyNormalSuggested
                  ? "当前 AI 分类为正常。若人工判断存在并发症，请在下方四类并发症范围内选择最终分类与类型。"
                  : "系统会根据当前随访中的 AI category 收窄到相关并发症类别。正常不属于并发症分类，最终类型仍由医生确认。"}
              </p>
              <div className="category-stack">
                {Object.entries(optionGroups).map(([category, items]) => (
                  <div key={category} className="category-group">
                    <div className="panel-heading" style={{ alignItems: "center" }}>
                      <strong>{category}</strong>
                      <span className="pill">{items.length} 项</span>
                    </div>
                    <div className="chip-grid" style={{ marginTop: 10 }}>
                      {items.map((item) => (
                        <button
                          key={item}
                          className={`toggle-chip ${complicationTypes.includes(item) ? "active" : ""}`}
                          onClick={() => toggleComplication(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="field">
              <label>并发症分级</label>
              <div className="chip-grid">
                {severityOptions.map((item) => (
                  <button
                    key={item}
                    className={`toggle-chip ${severityGrade === item ? "active" : ""}`}
                    onClick={() => setSeverityGrade(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="timeline-card">
            <h3>正常</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              当前人工结论为正常，即本次随访未发现并发症，不需要再选择四类并发症中的任何一类。
            </p>
          </div>
        )}

        <div className="field">
          <label htmlFor="doctor-comment">医生意见</label>
          <textarea
            id="doctor-comment"
            className="report-textarea"
            onChange={(event) => setDoctorComment(event.target.value)}
            value={doctorComment}
          />
        </div>

        {error ? <p style={{ color: "#9a4f40", margin: 0 }}>{error}</p> : null}
        {success ? <p style={{ color: "#1f5a3c", margin: 0 }}>{success}</p> : null}

        <div className="action-row">
          <button
            className="button-secondary"
            disabled={isPending}
            onClick={() => submit("draft")}
            type="button"
          >
            保存草稿
          </button>
          <button
            className="button-primary"
            disabled={isPending}
            onClick={() => submit("finalized")}
            type="button"
          >
            提交最终报告
          </button>
        </div>
      </div>
    </article>
  );
}
