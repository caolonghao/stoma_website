"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function UploadImageForm() {
  const router = useRouter();
  const [shotDate, setShotDate] = useState("");
  const [positionType, setPositionType] = useState("sitting_front");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("请先选择一张图片");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("shotDate", shotDate);
    formData.append("positionType", positionType);

    const response = await fetch("/api/images", {
      method: "POST",
      body: formData
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error ?? "上传失败");
      return;
    }

    setSuccess(`已上传 ${file.name}，系统已自动归入 ${body.followup.followupDate} 的随访记录`);
    setFile(null);
    setShotDate("");
    setPositionType("sitting_front");

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <article className="upload-card panel-surface">
      <p className="eyebrow">Guided Upload</p>
      <h3>影像上传与随访归档</h3>
      <p className="muted">
        只需要填写拍摄日期与体位。系统会自动把同一天上传的图片归成一次随访，并异步等待 AI 结果。
      </p>
      <div className="clinical-meta">
        <span>1. 选择拍摄日期</span>
        <span>2. 选择体位</span>
        <span>3. 上传后自动进入 AI 队列</span>
      </div>

      <form className="form-grid" onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="upload-shot-date">拍摄日期</label>
          <input
            id="upload-shot-date"
            onChange={(event) => setShotDate(event.target.value)}
            required
            type="date"
            value={shotDate}
          />
        </div>
        <div className="field">
          <label htmlFor="upload-position-type">体位</label>
          <select
            id="upload-position-type"
            onChange={(event) => setPositionType(event.target.value)}
            value={positionType}
          >
            <option value="sitting_front">端坐正位</option>
            <option value="sitting_side">端坐侧位</option>
            <option value="supine">平卧位</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="upload-file">影像文件</label>
          <input
            id="upload-file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
            type="file"
          />
        </div>

        {error ? <p style={{ color: "#9a4f40", margin: 0 }}>{error}</p> : null}
        {success ? <p style={{ color: "#1f5a3c", margin: 0 }}>{success}</p> : null}

        <div className="action-row">
          <button className="button-primary" disabled={isPending} type="submit">
            {isPending ? "上传中..." : "上传并归档"}
          </button>
        </div>
      </form>
    </article>
  );
}
