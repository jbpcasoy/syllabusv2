import { getCurrentUser } from "@/lib/auth";
import { getNavItems } from "@/lib/navigation";
import { getUserRoles } from "@/lib/roles";
import { hasAnyRole } from "@/types/roles";
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  // Signed-out pages (login/register) get no sidebar.
  if (!user) return <>{children}</>;

  const roles = await getUserRoles(user.id);
  const items = getNavItems(roles);

  return (
    <div className="flex">
      <Sidebar items={items} />
      <div className="min-w-0 flex-1">
        {!hasAnyRole(roles) && (
          <div
            role="status"
            className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:px-6 lg:px-8"
          >
            Your account isn&apos;t assigned to a program or office yet. You
            can browse the university structure, but you can&apos;t submit or
            review syllabi until a program chair or administrator adds you.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
