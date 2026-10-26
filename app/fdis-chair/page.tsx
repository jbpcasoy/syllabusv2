import { FdisChairManager } from "@/components/fdis-chair/fdis-chair-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "FDIS chair" };

export default async function FdisChairPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/fdis-chair");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <FdisChairManager canManage={await canSomewhere(user, "fdisChair.write")} />
    </main>
  );
}
