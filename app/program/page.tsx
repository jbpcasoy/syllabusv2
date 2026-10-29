import { ProgramManager } from "@/components/program/program-manager";
import { getCurrentUser } from "@/lib/auth";
import { getUserRoles } from "@/lib/roles";
import { redirect } from "next/navigation";

export const metadata = { title: "Programs" };

export default async function ProgramPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/program");

  // Writes are scoped, so the manager decides per row from the user's own
  // roles (lib/capability-rules.ts). The routes still check every target.
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProgramManager roles={await getUserRoles(user.id)} />
    </main>
  );
}
