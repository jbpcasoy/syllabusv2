import { ProspectusManager } from "@/components/prospectus/prospectus-manager";
import { getCurrentUser } from "@/lib/auth";
import { canManageProspectuses } from "@/lib/prospectus";
import { redirect } from "next/navigation";

export const metadata = { title: "Prospectuses" };

export default async function ProspectusPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/prospectus");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProspectusManager canManage={canManageProspectuses(user)} />
    </main>
  );
}
