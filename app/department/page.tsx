import { DepartmentManager } from "@/components/department/department-manager";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Departments" };

export default async function DepartmentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/department");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <DepartmentManager />
    </main>
  );
}
