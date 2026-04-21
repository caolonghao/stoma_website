"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const rememberedKey = "stoma-atlas-remembered-account";

export function LoginForm() {
  const router = useRouter();
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
      setError(body.error ?? "登录失败");
      return;
    }

    window.localStorage.setItem("stoma_atlas_token", body.token);

    if (rememberAccount) {
      window.localStorage.setItem(rememberedKey, account);
    } else {
      window.localStorage.removeItem(rememberedKey);
    }

    startTransition(() => {
      router.push(body.user.role === "doctor" ? "/doctor/patients" : "/patient/dashboard");
      router.refresh();
    });
  }

  return (
    <>
      <div>
        <p className="eyebrow">Secure Entry</p>
        <h2>登录</h2>
        <p className="muted" style={{ marginTop: 10 }}>
          医生可使用默认测试账号 `doctor / Doctor123!` 登录。患者端可先自行注册。
        </p>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="account">账号 / 手机号</label>
          <input
            id="account"
            name="account"
            onChange={(event) => setAccount(event.target.value)}
            placeholder="doctor 或 13800000001"
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
          <span className="muted">JWT 登录会话</span>
        </div>
        {error ? <p style={{ color: "#9a4f40", margin: 0 }}>{error}</p> : null}
        <button className="button-primary" disabled={isPending} type="submit">
          {isPending ? "登录中..." : "进入系统"}
        </button>
      </form>
    </>
  );
}
