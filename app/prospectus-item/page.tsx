import { ProspectusItemManager } from "@/components/prospectus-item/prospectus-item-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "Prospectus items" };

export default async function ProspectusItemPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/prospectus-item");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProspectusItemManager canManage={await canSomewhere(user, "prospectusItem.write")} />
    </main>
  );
}
