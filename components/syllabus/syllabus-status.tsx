import type { SyllabusAccess, SyllabusStatus } from "@/lib/syllabus-client";

const STATUS_STYLES: Record<SyllabusStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-50 text-blue-700",
};

export const STATUS_LABELS: Record<SyllabusStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
};

export const ACCESS_LABELS: Record<SyllabusAccess, string> = {
  lead: "Lead",
  coAuthor: "Co-author",
  admin: "Admin",
  referencer: "Referencing program",
};

export function SyllabusStatusBadge({ status }: { status: SyllabusStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** "2026-2027 · First Semester" */
export function termLabel(
  term: { semester: string; school_year_label: string } | undefined,
) {
  if (!term) return "—";
  return [term.school_year_label, term.semester].filter(Boolean).join(" · ");
}
