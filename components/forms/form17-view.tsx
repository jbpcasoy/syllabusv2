import { formatDate } from "@/lib/format-date";
import type { Form17ExportData } from "@/lib/forms/export";
import { FormHeader, SignatureLines } from "./signature-lines";

const cell = "border border-gray-400 px-2 py-1 align-top";

/** Read-only, print-friendly Form 17 from its export data. */
export function Form17View({ data }: { data: Form17ExportData }) {
  const { header } = data;
  return (
    <article className="bg-white p-6 text-gray-900 print:p-0">
      <FormHeader institution={data.institution} form={data.form} />

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <Line label="Reviewer's Name" value={header.reviewerName} />
        <Line
          label="Date of Review"
          value={header.dateOfReview ? formatDate(header.dateOfReview) : ""}
        />
        <Line label="Course Code" value={header.courseCode} />
        <Line label="Course Title" value={header.courseTitle} />
        <Line
          label="Name(s) of Course Instructor/s"
          value={header.instructors.join(", ")}
        />
        <Line label="Version" value={String(data.syllabus.versionNo)} />
      </dl>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className={`${cell} text-left`}>Criteria</th>
            <th className={`${cell} w-12`}>Yes</th>
            <th className={`${cell} w-12`}>No</th>
            <th className={`${cell} w-1/3 text-left`}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.sections.map((section) => [
            <tr key={section.key}>
              <td colSpan={4} className={`${cell} font-semibold`}>
                {section.key}. {section.title}
              </td>
            </tr>,
            ...section.criteria.map((criterion) => (
              <tr key={criterion.key}>
                <td className={cell}>
                  {criterion.key.slice(1)}. {criterion.text}
                </td>
                <td className={`${cell} text-center`}>
                  {criterion.answer === "yes" ? "✓" : ""}
                </td>
                <td className={`${cell} text-center`}>
                  {criterion.answer === "no" ? "✓" : ""}
                </td>
                <td className={cell}>{criterion.remarks}</td>
              </tr>
            )),
          ])}
        </tbody>
      </table>

      <section className="mt-4 text-sm">
        <h3 className="font-semibold">Suggestions for Improvement:</h3>
        <p className="mt-1 min-h-12 whitespace-pre-line">{data.suggestions}</p>
      </section>

      <section className="mt-4">
        <h3 className="text-sm font-semibold">
          Reviewed by: University Curriculum Committee
        </h3>
        <SignatureLines signatures={data.signatures} />
      </section>
    </article>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-medium">{label}:</dt>
      <dd className="grow border-b border-gray-400">{value}</dd>
    </div>
  );
}
