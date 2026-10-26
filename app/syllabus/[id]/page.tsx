import { SyllabusDetail } from "@/components/syllabus/syllabus-detail";
import { getCurrentUser } from "@/lib/auth";
import { getUserRoles } from "@/lib/roles";
import { redirect } from "next/navigation";

export const metadata = { title: "Syllabus" };

type PageProps = { params: Promise<{ id: string }> };

export default async function SyllabusDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/syllabus/${id}`)}`);

  const roles = await getUserRoles(user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <SyllabusDetail
        id={id}
        viewer={{
          id: user.id,
          isAdmin: roles.isAdmin,
          chairOfPrograms: roles.chairOfPrograms,
        }}
      />
    </main>
  );
}
