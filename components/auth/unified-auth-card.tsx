"use client";

import { useEffect, useState } from "react";
import { AuthModeTabs } from "@/components/auth/auth-mode-tabs";
import { AuthRoleTabs } from "@/components/auth/auth-role-tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

export function UnifiedAuthCard() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [patientMode, setPatientMode] = useState<"login" | "register">("login");

  useEffect(() => {
    if (role === "doctor") {
      setPatientMode("login");
    }
  }, [role]);

  return (
    <div className="auth-card-stack">
      <div className="auth-card-copy">
        <p className="eyebrow">Secure Entry</p>
        <h2>统一认证入口</h2>
        <p className="muted" style={{ marginTop: 10 }}>
          先选择身份，再完成登录。患者可以在首页内直接注册，医生从同一入口进入患者管理总览。
        </p>
      </div>

      <AuthRoleTabs activeRole={role} onChange={setRole} />

      {role === "patient" ? (
        <AuthModeTabs activeMode={patientMode} onChange={setPatientMode} />
      ) : null}

      {role === "doctor" ? (
        <LoginForm
          key="doctor-login"
          description="使用科室分配账号进入医生工作台，可查看患者列表、随访与医生报告入口。"
          helperText="默认测试账号：doctor / Doctor123!"
          role="doctor"
          title="医生登录"
        />
      ) : null}

      {role === "patient" && patientMode === "login" ? (
        <LoginForm
          key="patient-login"
          description="登录后可进入个人随访空间，上传影像并查看医生最终结论。"
          helperText="如果还没有账号，可切换到注册。"
          role="patient"
          title="患者登录"
        />
      ) : null}

      {role === "patient" && patientMode === "register" ? (
        <RegisterForm
          key="patient-register"
          description="先建立患者身份，后续影像、随访与医生报告都会挂在同一患者视角下展示。"
          title="患者注册"
        />
      ) : null}
    </div>
  );
}
