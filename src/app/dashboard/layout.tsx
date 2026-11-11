import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const sessionUser = {
    id: session.userId,
    name: session.name || null,
    email: session.email,
    role: session.role,
    organizationId: session.organizationId,
    organizationName: session.organizationName,
  };

  return <DashboardSidebar user={sessionUser}>{children}</DashboardSidebar>;
}
