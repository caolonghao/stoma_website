import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canAccessPortal, getHomeDestination } from "@/lib/auth/page-access";

export default async function PatientLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (canAccessPortal(user, "patient")) {
    return children;
  }

  redirect(getHomeDestination(user) ?? "/");
}
