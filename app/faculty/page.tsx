import { FacultyManager } from "@/components/faculty/faculty-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "Faculty" };

export default async function FacultyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/faculty");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <FacultyManager canManage={await canSomewhere(user, "faculty.write")} />
    </main>
  );
}
