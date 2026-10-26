import { DepartmentHeadManager } from "@/components/department-head/department-head-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "Department heads" };

export default async function DepartmentHeadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/department-head");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <DepartmentHeadManager
        canManage={await canSomewhere(user, "departmentHead.write")}
      />
    </main>
  );
}
