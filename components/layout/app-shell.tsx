import { getCurrentUser } from "@/lib/auth";
import { getNavItemsForRole } from "@/lib/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  // Signed-out pages (login/register) get no sidebar.
  if (!user) return <>{children}</>;

  const items = getNavItemsForRole(user.role || null);

  return (
    <div className="flex">
      <Sidebar items={items} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
