import { ProspectusItemManager } from "@/components/prospectus-item/prospectus-item-manager";
import { getCurrentUser } from "@/lib/auth";
import { canManageProspectusItems } from "@/lib/prospectus-item";
import { redirect } from "next/navigation";

export const metadata = { title: "Prospectus items" };

export default async function ProspectusItemPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/prospectus-item");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProspectusItemManager canManage={canManageProspectusItems(user)} />
    </main>
  );
}
