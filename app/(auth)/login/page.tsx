import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      asideCopy="同一套系统覆盖医生端与患者端，但两边工作重心不同：医生重在判断与管理，患者重在上传与查看。"
      asideTitle="A single atlas, two calm entry points."
      description="把患者建档、影像归档、AI 辅助判断与人工最终结论放进同一条连续工作流里。"
      footer={
        <>
          没有账号？
          {" "}
          <Link className="auth-link" href="/register">
            去注册
          </Link>
        </>
      }
      portal="Unified Sign-In"
      title="临床判断与患者随访，从同一入口进入"
    >
      <LoginForm />
    </AuthShell>
  );
}
