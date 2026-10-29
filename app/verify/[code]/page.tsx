import { VerifyForm } from "@/components/verify/verify-form";
import { findApproval } from "@/lib/approval-verify";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import { createAdminPb } from "@/lib/pocketbase";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Verify approval" };

type PageProps = { params: Promise<{ code: string }> };

const ACTING_AS_LABELS = {
  holder: "",
  proxy: " (as proxy)",
  standIn: " (as stand-in)",
} as const;

// Any signed-in user may check what a printed approval code refers to.
export default async function VerifyApprovalPage({ params }: PageProps) {
  const { code } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/verify/${code}`)}`);

  const approval = await findApproval(await createAdminPb(), code);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Verify approval</h1>
      <p className="mt-1 font-mono text-sm text-gray-600">{code}</p>

      {approval ? (
        <dl className="mt-6 divide-y divide-gray-100 rounded-lg bg-white text-sm shadow ring-1 ring-black/5">
          <Row label="Status" value="Valid approval" />
          <Row
            label="Course"
            value={`${approval.course.code} — ${approval.course.title}`}
          />
          <Row
            label="Program"
            value={`${approval.program.name} (${approval.program.code})`}
          />
          <Row
            label="Term"
            value={[approval.term.schoolYearLabel, approval.term.semester]
              .filter(Boolean)
              .join(" · ")}
          />
          <Row
            label="Approved at"
            value={`Stage ${approval.stage}, ${approval.stageLabel}`}
          />
          <Row
            label="Approved by"
            value={`${approval.reviewerName || "—"}${ACTING_AS_LABELS[approval.actingAs]}`}
          />
          <Row label="Date" value={formatDate(approval.approvedAt)} />
        </dl>
      ) : (
        <p
          role="alert"
          className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          No approval matches this code. Check it for typos; codes look like
          SYL-2627-1-0042-S2.
        </p>
      )}

      {approval && (
        <p className="mt-4 text-sm">
          <Link
            href={`/syllabus/${approval.syllabusId}`}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Open the syllabus
          </Link>{" "}
          <span className="text-gray-500">(if you have access to it)</span>
        </p>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <VerifyForm initialCode={approval ? "" : code} />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-4 py-3">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-900">{value || "—"}</dd>
    </div>
  );
}
