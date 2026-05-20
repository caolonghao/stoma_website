import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canAccessPortal, getHomeDestination } from "@/lib/auth/page-access";

export default async function DoctorLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (canAccessPortal(user, "doctor")) {
    return children;
  }

  redirect(getHomeDestination(user) ?? "/");
}
