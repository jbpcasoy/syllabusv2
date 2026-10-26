import { SyllabusManager } from "@/components/syllabus/syllabus-manager";
import { getCurrentUser } from "@/lib/auth";
import { listProgramsOfUser } from "@/lib/faculty";
import { redirect } from "next/navigation";

export const metadata = { title: "My syllabi" };

export default async function SyllabusPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/syllabus");

  const programs = (await listProgramsOfUser(user.id)).map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <SyllabusManager programs={programs} />
    </main>
  );
}
