import { DeanManager } from "@/components/dean/dean-manager";
import { getCurrentUser } from "@/lib/auth";
import { canManageDeans } from "@/lib/dean";
import { redirect } from "next/navigation";

export const metadata = { title: "Deans" };

export default async function DeanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dean");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <DeanManager canManage={canManageDeans(user)} />
    </main>
  );
}
