type ReportSummaryProps = {
  report: {
    hasComplication: boolean;
    complicationTypes: string[];
    severityGrade: string | null;
    doctorComment: string;
    status: "draft" | "finalized";
  } | null;
};

export function ReportSummary({ report }: ReportSummaryProps) {
  if (!report) {
    return (
      <article className="report-card">
        <p className="eyebrow">Doctor Report</p>
        <h3>等待医生判读</h3>
        <p className="muted" style={{ marginTop: 10 }}>
          当前还没有最终人工报告，系统会在医生完成判读后展示结果。
        </p>
      </article>
    );
  }

  return (
    <article className="report-card panel-surface">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Doctor Report</p>
          <h3>医生人工结论</h3>
        </div>
        <span className={`pill ${report.status === "finalized" ? "" : "warn"}`}>
          {report.status === "finalized" ? "最终结果" : "草稿"}
        </span>
      </div>
      <div className="timeline-stack" style={{ marginTop: 16 }}>
        <div className="timeline-card">
          <h3>{report.hasComplication ? "存在并发症" : "未发现并发症"}</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            {report.hasComplication
              ? report.complicationTypes.join("、")
              : "本次随访未记录并发症类型"}
          </p>
        </div>
        <div className="timeline-card">
          <h3>分级</h3>
          <p className="muted">{report.severityGrade ?? "无"}</p>
        </div>
        <div className="timeline-card">
          <h3>医生意见</h3>
          <p className="muted">{report.doctorComment || "暂无补充意见"}</p>
        </div>
      </div>
    </article>
  );
}
