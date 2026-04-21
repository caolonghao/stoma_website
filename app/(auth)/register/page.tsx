import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      asideCopy="患者端的目标不是把所有信息都堆给用户，而是用更轻的引导帮助他们完成上传并安心看到结果。"
      asideTitle="Less friction, more confidence."
      description="患者注册后即可进入个人随访空间，上传影像并跟踪每次随访的 AI 状态与医生最终结论。"
      footer={
        <>
          已有账号？
          {" "}
          <Link className="auth-link" href="/login">
            去登录
          </Link>
        </>
      }
      portal="Patient Registration"
      title="先完成注册，再进入你的随访工作区"
    >
      <RegisterForm />
    </AuthShell>
  );
}
