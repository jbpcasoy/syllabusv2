import { getCurrentUser } from "@/lib/auth";
import { canAnywhere } from "@/lib/capability-rules";
import { getUserRoles } from "@/lib/roles";
import { redirect } from "next/navigation";

// The home page sends each user where their work is: the dashboard for
// anyone who has one, otherwise their syllabi, and the login when signed out.
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roles = await getUserRoles(user.id);
  redirect(canAnywhere(roles, "dashboard.view") ? "/dashboard" : "/syllabus");
}
