import { PrintableForms } from "@/components/forms/printable-forms";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Review forms" };

type PageProps = { params: Promise<{ id: string }> };

// Access is checked by the export routes the page loads from.
export default async function SyllabusFormsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/syllabus/${id}/forms`)}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
      <PrintableForms syllabusId={id} />
    </main>
  );
}
