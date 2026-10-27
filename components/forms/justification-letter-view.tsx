import type { JustificationLetterData } from "@/lib/forms/justification";

const cell = "border border-gray-900 px-2 py-1 align-top";

/** Read-only, print-friendly Justification Form letter from its export data. */
export function JustificationLetterView({ data }: { data: JustificationLetterData }) {
  const t = data.template;
  return (
    <article className="bg-white p-6 font-serif text-sm text-gray-900 print:p-0">
      <header className="text-center">
        <p className="text-base font-bold">{t.letterhead.name}</p>
        <p className="text-xs">{t.letterhead.address}</p>
        <p className="text-xs">
          {t.letterhead.contact}, {t.letterhead.website}
        </p>
      </header>

      <p className="mt-6">{data.date}</p>

      <address className="mt-4 not-italic">
        <span className="block font-semibold">{data.recipientName || " "}</span>
        <span className="block">{t.recipient.title}</span>
        <span className="block">{t.recipient.institution}</span>
        <span className="block">{t.recipient.location}</span>
      </address>

      <p className="mt-4">{t.salutation}</p>
      <p className="mt-3">
        {t.opening.before}
        <strong className="underline">{data.semester}</strong>
        {t.opening.between}
        <strong className="underline">{data.schoolYear}</strong>
        {t.opening.after}
      </p>

      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr>
            {t.columns.map((column) => (
              <th key={column} className={cell}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              <td className={cell}>{row.courseCode}</td>
              <td className={cell}>{row.courseTitle}</td>
              <td className={cell}>{row.leadAuthor}</td>
              <td className={cell}>{row.justification}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4">{t.closing}</p>
      <p className="mt-3">{t.valediction}</p>

      <div className="mt-8 w-72">
        <div className="text-center">{data.facultyName}</div>
        <div className="border-t border-gray-900 text-center text-xs">
          {t.facultyLabel}
        </div>
      </div>
      <p className="mt-6">{t.notedPrefix}</p>
      <div className="mt-6 w-72">
        <div className="text-center">{data.programChairName}</div>
        <div className="border-t border-gray-900 text-center text-xs">
          {t.chairLabel}
        </div>
      </div>
    </article>
  );
}
