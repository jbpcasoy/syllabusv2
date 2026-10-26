import { VpaaManager } from "@/components/vpaa/vpaa-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "VPAA" };

export default async function VpaaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vpaa");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <VpaaManager canManage={await canSomewhere(user, "vpaa.write")} />
    </main>
  );
}
