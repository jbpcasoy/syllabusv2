/**
 * The Justification Form letter to the CITL Director, transcribed from
 * docs/forms/syllabus_justification_template.md. Fixed text is printed
 * verbatim; only the date, semester, school year, recipient name, rows and
 * printed names vary.
 */
export const JUSTIFICATION_TEMPLATE = {
  letterhead: {
    name: "BUKIDNON STATE UNIVERSITY",
    address: "Malaybalay City, Bukidnon 8700",
    contact: "Tel (088) 813-5661 to 5663; Telefax (088) 813-2717",
    website: "www.buksu.edu.ph",
  },
  recipient: {
    title: "CITL Director",
    institution: "Bukidnon State University",
    location: "Malaybalay, Bukidnon",
  },
  salutation: "Dear Madam:",
  /** Printed around the bold, underlined semester and school year. */
  opening: {
    before:
      "The undersigned wishes to inform your good office that the following syllabus/es for ",
    between: ", ",
    after: " do/es not have the affixed signature of the Lead Faculty:",
  },
  columns: ["Course Code", "Course Title", "Lead Author", "Justification"],
  closing: "Thank you for your consideration.",
  valediction: "Very truly yours,",
  facultyLabel: "Signature over printed name of Faculty",
  notedPrefix: "Noted:",
  chairLabel: "Signature over printed name of Program Chair",
} as const;

export interface JustificationLetterData {
  template: typeof JUSTIFICATION_TEMPLATE;
  /** "October 27, 2026" */
  date: string;
  /** "1st Semester", "2nd Semester" or "Summer". */
  semester: string;
  /** "SY 2026-2027" */
  schoolYear: string;
  /** The active CITL director, or "" when none. */
  recipientName: string;
  rows: {
    courseCode: string;
    courseTitle: string;
    leadAuthor: string;
    justification: string;
  }[];
  /** Printed names over the blank signature lines. */
  facultyName: string;
  programChairName: string;
}

const SEMESTERS: Record<string, string> = {
  "First Semester": "1st Semester",
  "Second Semester": "2nd Semester",
  Summer: "Summer",
};

/** "October 27, 2026" in Philippine time. */
export function letterDate(at: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(at);
}

export function buildJustificationLetter(input: {
  at: Date;
  semester: string;
  schoolYearLabel: string;
  courseCode: string;
  courseTitle: string;
  entries: readonly { authorName: string; reason: string }[];
  recipientName: string;
  facultyName: string;
  programChairName: string;
}): JustificationLetterData {
  return {
    template: JUSTIFICATION_TEMPLATE,
    date: letterDate(input.at),
    semester: SEMESTERS[input.semester] ?? input.semester,
    schoolYear: input.schoolYearLabel ? `SY ${input.schoolYearLabel}` : "",
    recipientName: input.recipientName,
    rows: input.entries.map((entry) => ({
      courseCode: input.courseCode,
      courseTitle: input.courseTitle,
      leadAuthor: entry.authorName,
      justification: entry.reason,
    })),
    facultyName: input.facultyName,
    programChairName: input.programChairName,
  };
}
