import { DepartmentManager } from "@/components/department/department-manager";

export const metadata = { title: "Departments" };

export default function DepartmentPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <DepartmentManager />
    </main>
  );
}
