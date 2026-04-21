import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { UnifiedAuthCard } from "@/components/auth/unified-auth-card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getHomeDestination } from "@/lib/auth/page-access";

export default async function HomePage() {
  const user = await getCurrentUser();
  const destination = getHomeDestination(user);

  if (destination) {
    redirect(destination);
  }

  return (
    <AuthShell
      asideCopy="未登录状态下，系统只保留认证入口；登录后会按照角色进入对应工作区。"
      asideTitle="Single secure entry"
      description="患者可在首页完成登录或注册，医生则从同一入口进入患者总览与随访工作台。"
      footer="患者可在首页切换到注册模式，医生使用科室分配账号登录。"
      portal="Unified Access"
      title="肠造口随访管理平台"
    >
      <UnifiedAuthCard />
    </AuthShell>
  );
}
