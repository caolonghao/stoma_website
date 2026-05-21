"use client";

import { useEffect, useState, useTransition } from "react";
import { getErrorMessage } from "@/lib/forms/error-message";

const rememberedKey = "stoma-atlas-remembered-account";

type LoginFormProps = {
  description?: string;
  helperText?: string;
  role?: "doctor" | "patient";
  title?: string;
};

export function LoginForm({
  description = "请输入账号与密码完成登录。",
  helperText = "JWT 登录会话",
  role = "patient",
  title = "登录"
}: LoginFormProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [rememberAccount, setRememberAccount] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const remembered = window.localStorage.getItem(rememberedKey);
    if (remembered) {
      setAccount(remembered);
    }
  }, []);

  useEffect(() => {
    setError("");
  }, [role]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        account,
        password
      })
    });

    const body = await response.json();

    if (!response.ok) {
      setError(getErrorMessage(body.error, "登录失败"));
      return;
    }

    window.localStorage.setItem("stoma_atlas_token", body.token);

    if (rememberAccount) {
      window.localStorage.setItem(rememberedKey, account);
    } else {
      window.localStorage.removeItem(rememberedKey);
    }

    const destination =
      body.user.role === "doctor" ? "/doctor/patients" : "/patient/dashboard";

    startTransition(() => {
      window.location.assign(destination);
    });
  }

  return (
    <>
      <div>
        <p className="eyebrow">Secure Entry</p>
        <h2>{title}</h2>
        <p className="muted" style={{ marginTop: 10 }}>
          {description}
        </p>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="account">{role === "doctor" ? "医生账号" : "账号 / 手机号"}</label>
          <input
            id="account"
            name="account"
            onChange={(event) => setAccount(event.target.value)}
            placeholder={role === "doctor" ? "请输入医生账号" : "请输入手机号"}
            required
            value={account}
          />
        </div>
        <div className="field">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            required
            type="password"
            value={password}
          />
        </div>
        <div className="inline-row">
          <label className="checkbox-row" htmlFor="remember-account">
            <input
              checked={rememberAccount}
              id="remember-account"
              onChange={(event) => setRememberAccount(event.target.checked)}
              type="checkbox"
            />
            记住账号
          </label>
          <span className="muted">{helperText}</span>
        </div>
        {error ? <p style={{ color: "#9a4f40", margin: 0 }}>{error}</p> : null}
        <button className="button-primary" disabled={isPending} type="submit">
          {isPending ? "登录中..." : role === "doctor" ? "进入医生工作台" : "进入患者空间"}
        </button>
      </form>
    </>
  );
}
