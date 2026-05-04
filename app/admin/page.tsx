import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/dashboard";

interface AdminSession {
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  expires: number;
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");

  if (!sessionCookie) {
    redirect("/admin/login");
  }

  try {
    const session: AdminSession = JSON.parse(sessionCookie.value);

    if (session.expires < Date.now()) {
      redirect("/admin/login");
    }

    return <AdminDashboard user={session} />;
  } catch {
    redirect("/admin/login");
  }
}
