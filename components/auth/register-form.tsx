"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name,
        phone,
        password
      })
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error ?? "注册失败");
      return;
    }

    window.localStorage.setItem("stoma_atlas_token", body.token);

    startTransition(() => {
      router.push("/patient/dashboard");
      router.refresh();
    });
  }

  return (
    <>
      <div>
        <p className="eyebrow">Patient Onboarding</p>
        <h2>患者注册</h2>
        <p className="muted" style={{ marginTop: 10 }}>
          先建立登录身份，后续影像、随访与医生报告都会挂在同一患者视角下展示。
        </p>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="name">姓名</label>
          <input
            id="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="请输入姓名"
            required
            value={name}
          />
        </div>
        <div className="field">
          <label htmlFor="phone">手机号</label>
          <input
            id="phone"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="请输入 11 位手机号"
            required
            value={phone}
          />
        </div>
        <div className="field">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 位"
            required
            type="password"
            value={password}
          />
        </div>
        {error ? <p style={{ color: "#9a4f40", margin: 0 }}>{error}</p> : null}
        <button className="button-primary" disabled={isPending} type="submit">
          {isPending ? "注册中..." : "创建账号"}
        </button>
      </form>
    </>
  );
}
