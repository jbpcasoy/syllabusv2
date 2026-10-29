import { DepartmentManager } from "@/components/department/department-manager";
import { getCurrentUser } from "@/lib/auth";
import { getUserRoles } from "@/lib/roles";
import { redirect } from "next/navigation";

export const metadata = { title: "Departments" };

export default async function DepartmentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/department");

  // Writes are scoped, so the manager decides per row from the user's own
  // roles (lib/capability-rules.ts). The routes still check every target.
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <DepartmentManager roles={await getUserRoles(user.id)} />
    </main>
  );
}
