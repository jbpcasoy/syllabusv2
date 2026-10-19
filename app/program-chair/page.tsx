import { ProgramChairManager } from "@/components/program-chair/program-chair-manager";
import { getCurrentUser } from "@/lib/auth";
import { canManageProgramChairs } from "@/lib/program-chair";
import { redirect } from "next/navigation";

export const metadata = { title: "Program chairs" };

export default async function ProgramChairPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/program-chair");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProgramChairManager canManage={canManageProgramChairs(user)} />
    </main>
  );
}
