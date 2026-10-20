import { VpaaManager } from "@/components/vpaa/vpaa-manager";
import { getCurrentUser } from "@/lib/auth";
import { canManageVpaas } from "@/lib/vpaa";
import { redirect } from "next/navigation";

export const metadata = { title: "VPAA" };

export default async function VpaaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vpaa");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <VpaaManager canManage={canManageVpaas(user)} />
    </main>
  );
}
