import { ProgramManager } from "@/components/program/program-manager";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Programs" };

export default async function ProgramPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/program");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProgramManager />
    </main>
  );
}
