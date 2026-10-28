import { AuditManager } from "@/components/audit/audit-manager";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "Audit log" };

// audit.view (admin). Read-only.
export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/audit");

  if (!(await can(user, "audit.view"))) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Audit log</h1>
        <p className="mt-2 text-sm text-gray-600">
          You don&apos;t have permission to view the audit log.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <AuditManager />
    </main>
  );
}
