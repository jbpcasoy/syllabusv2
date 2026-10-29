import { PrintableJustificationLetter } from "@/components/forms/printable-justification-letter";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Justification letter" };

type PageProps = { params: Promise<{ id: string }> };

// Access is checked by the export route the page loads from (lead only).
export default async function SyllabusJustificationLetterPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/syllabus/${id}/forms/justification`)}`,
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
      <PrintableJustificationLetter syllabusId={id} />
    </main>
  );
}
