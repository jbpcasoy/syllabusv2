import { DashboardManager } from "@/components/dashboard/dashboard-manager";
import { getCurrentUser } from "@/lib/auth";
import { canAnywhere } from "@/lib/capability-rules";
import { getUserRoles } from "@/lib/roles";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard" };

// dashboard.view. The API scopes every panel; this page only decides
// whether there is a dashboard to show at all.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const roles = await getUserRoles(user.id);
  if (!canAnywhere(roles, "dashboard.view")) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-4 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
          No dashboard for your roles. Dashboards are for program reviewers,
          program chairs, department heads, deans, the FDIS chair, the CITL
          director and the VPAA. Your syllabi are under{" "}
          <Link href="/syllabus" className="font-medium text-indigo-600 underline">
            My Syllabi
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <DashboardManager />
    </main>
  );
}
