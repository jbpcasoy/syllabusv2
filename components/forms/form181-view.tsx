import type { ExportPoint, Form181ExportData } from "@/lib/forms/export";
import { FormHeader, SignatureLines } from "./signature-lines";

const cell = "border border-gray-400 px-2 py-1 align-top";

/** Read-only, print-friendly Form 18-1 from its export data. */
export function Form181View({ data }: { data: Form181ExportData }) {
  return (
    <article className="bg-white p-6 text-gray-900 print:p-0">
      <FormHeader institution={data.institution} form={data.form} />

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="font-medium">Course Code:</dt>
          <dd className="grow border-b border-gray-400">{data.header.courseCode}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Course Title:</dt>
          <dd className="grow border-b border-gray-400">{data.header.courseTitle}</dd>
        </div>
      </dl>

      <h3 className="mt-6 text-sm font-semibold">Part A. {data.partA.title}</h3>
      <PointsTable points={data.partA.points} />
      <p className="mt-3 text-sm italic">{data.partA.certification}</p>
      <SignatureLines signatures={data.partA.signatures} />

      <h3 className="mt-8 text-sm font-semibold break-before-page">
        Part B. {data.partB.title}
      </h3>
      <PointsTable points={data.partB.points} withCodes />
      <SignatureLines signatures={data.partB.signatures} />
    </article>
  );
}

function PointsTable({
  points,
  withCodes = false,
}: {
  points: ExportPoint[];
  withCodes?: boolean;
}) {
  return (
    <table className="mt-2 w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className={`${cell} text-left`}>Review Points</th>
          <th className={`${cell} text-left`}>Action Taken</th>
          <th className={`${cell} w-20`}>Page Number</th>
          <th className={`${cell} text-left`}>Remarks</th>
        </tr>
      </thead>
      <tbody>
        {points.length === 0 ? (
          <tr>
            <td colSpan={4} className={`${cell} h-8`} />
          </tr>
        ) : (
          points.map((point, i) => (
            <tr key={i}>
              <td className={cell}>
                {withCodes && point.code && (
                  <span className="mr-1 font-mono">{point.code}</span>
                )}
                {point.reviewPoint}
              </td>
              <td className={cell}>{point.actionTaken}</td>
              <td className={`${cell} text-center`}>{point.pageNumber}</td>
              <td className={cell}>{point.remarks}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
