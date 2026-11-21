import { AdminDashboard } from "@/components/admin/dashboard";

import { verifyAdmin } from "@/lib/admin-access";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  if (!(await verifyAdmin())) redirect("/admin/login");
  return <AdminDashboard />;
}
