import { formatDate } from "@/lib/format-date";
import type { ExportSignature } from "@/lib/forms/export";

const ACTING_AS = { holder: "", proxy: " (proxy)", standIn: " (stand-in)" } as const;

/** Printed sign-off lines with the approval code beside each signature. */
export function SignatureLines({ signatures }: { signatures: ExportSignature[] }) {
  return (
    <div className="mt-4 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
      {signatures.map((line) => (
        <div key={line.role} className="text-sm">
          <div className="h-8 border-b border-gray-900" />
          <div className="mt-1 font-medium text-gray-900">
            {line.name || " "}
            {line.actingAs && ACTING_AS[line.actingAs]}
          </div>
          <div className="text-gray-600">{line.role}</div>
          {line.approvalCode && (
            <div className="mt-0.5 font-mono text-xs text-gray-700">
              {line.approvalCode} · {formatDate(line.approvedAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** The form's printed header block. */
export function FormHeader({
  institution,
  form,
}: {
  institution: { name: string; address: string };
  form: { code: string; revision: string; title: string; issueDate: string };
}) {
  return (
    <header className="text-center">
      <p className="text-sm font-semibold text-gray-900">{institution.name}</p>
      <p className="text-xs text-gray-600">{institution.address}</p>
      <h2 className="mt-2 text-base font-bold uppercase text-gray-900">
        {form.title}
      </h2>
      <p className="mt-1 text-xs text-gray-600">
        Document Code: {form.code} · Revision No.: {form.revision} · Issue
        Date: {form.issueDate}
      </p>
    </header>
  );
}
