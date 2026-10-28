import { ReviewWorkspace } from "@/components/syllabus/review-workspace";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Review syllabus" };

type PageProps = { params: Promise<{ id: string }> };

// Access and whether the caller may decide come from GET /api/syllabus/:id.
export default async function SyllabusReviewPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/syllabus/${id}/review`)}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ReviewWorkspace id={id} />
    </main>
  );
}
