import { ReviseWorkspace } from "@/components/syllabus/revise-workspace";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Revise syllabus" };

type PageProps = { params: Promise<{ id: string }> };

// Access and the lead check come from GET /api/syllabus/:id.
export default async function SyllabusRevisePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/syllabus/${id}/revise`)}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ReviseWorkspace id={id} />
    </main>
  );
}
