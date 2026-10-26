import { CitlDirectorManager } from "@/components/citl-director/citl-director-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "CITL director" };

export default async function CitlDirectorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/citl-director");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <CitlDirectorManager canManage={await canSomewhere(user, "citlDirector.write")} />
    </main>
  );
}
