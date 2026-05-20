"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const initialState = {
  name: "",
  gender: "female",
  birthDate: "",
  phone: "",
  stomaDate: "",
  stomaType: "colostomy",
  medicalRecordNo: ""
};

export function CreatePatientForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField(key: keyof typeof initialState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const response = await fetch("/api/patients", {
      method: "POST",
      headers: {
        authorization: `Bearer ${window.localStorage.getItem("stoma_atlas_token") ?? ""}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error ?? "建档失败");
      return;
    }

    setSuccess(`已创建 ${body.patient.name}`);
    setForm(initialState);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="portal-panel panel-surface">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">New File</p>
          <h2>新建患者档案</h2>
        </div>
        <span className="muted">录入后即可进入检索与随访管理</span>
      </div>
      <p className="panel-intro">先收集核心身份信息和造口信息，后续详情可在患者档案内继续补充。</p>

      <form className="form-grid" onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <div className="grid-compact">
          <div className="field">
            <label htmlFor="create-name">姓名</label>
            <input
              id="create-name"
              onChange={(event) => updateField("name", event.target.value)}
              required
              value={form.name}
            />
          </div>
          <div className="field">
            <label htmlFor="create-gender">性别</label>
            <select
              id="create-gender"
              onChange={(event) => updateField("gender", event.target.value)}
              value={form.gender}
            >
              <option value="female">女</option>
              <option value="male">男</option>
              <option value="unknown">未标注</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="create-birthDate">出生日期</label>
            <input
              id="create-birthDate"
              onChange={(event) => updateField("birthDate", event.target.value)}
              type="date"
              value={form.birthDate}
            />
          </div>
          <div className="field">
            <label htmlFor="create-phone">手机号</label>
            <input
              id="create-phone"
              onChange={(event) => updateField("phone", event.target.value)}
              value={form.phone}
            />
          </div>
          <div className="field">
            <label htmlFor="create-stomaDate">造口日期</label>
            <input
              id="create-stomaDate"
              onChange={(event) => updateField("stomaDate", event.target.value)}
              required
              type="date"
              value={form.stomaDate}
            />
          </div>
          <div className="field">
            <label htmlFor="create-stomaType">造口类型</label>
            <select
              id="create-stomaType"
              onChange={(event) => updateField("stomaType", event.target.value)}
              value={form.stomaType}
            >
              <option value="colostomy">结肠造口</option>
              <option value="ileostomy">回肠造口</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="create-medicalRecordNo">病历号</label>
            <input
              id="create-medicalRecordNo"
              onChange={(event) => updateField("medicalRecordNo", event.target.value)}
              required
              value={form.medicalRecordNo}
            />
          </div>
        </div>

        {error ? <p style={{ color: "#9a4f40", margin: 0 }}>{error}</p> : null}
        {success ? <p style={{ color: "#1f5a3c", margin: 0 }}>{success}</p> : null}

        <div className="action-row">
          <button className="button-primary" disabled={isPending} type="submit">
            {isPending ? "创建中..." : "确定建档"}
          </button>
        </div>
      </form>
    </section>
  );
}
