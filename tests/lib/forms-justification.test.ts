import {
  buildJustificationLetter,
  JUSTIFICATION_TEMPLATE,
  letterDate,
} from "@/lib/forms/justification";
import { describe, expect, it } from "vitest";

describe("letterDate", () => {
  it("formats in Philippine time", () => {
    // 20:00 UTC on the 26th is the 27th in Manila.
    expect(letterDate(new Date("2026-10-26T20:00:00Z"))).toBe("October 27, 2026");
  });
});

describe("buildJustificationLetter", () => {
  const input = {
    at: new Date("2026-10-27T02:00:00Z"),
    semester: "First Semester",
    schoolYearLabel: "2026-2027",
    courseCode: "Prof Ed 1",
    courseTitle: "The Child and Adolescent Learners",
    entries: [
      { authorName: "Maria Angelica C. Mugot", reason: "On official leave." },
      { authorName: "Ben Cruz", reason: "Retired." },
    ],
    recipientName: "Dr. Cecille Marie T. Improgo",
    facultyName: "Lea Santos",
    programChairName: "Paolo Reyes",
  };

  it("fills the variable parts and keeps the fixed text", () => {
    const letter = buildJustificationLetter(input);
    expect(letter).toEqual({
      template: JUSTIFICATION_TEMPLATE,
      date: "October 27, 2026",
      semester: "1st Semester",
      schoolYear: "SY 2026-2027",
      recipientName: "Dr. Cecille Marie T. Improgo",
      rows: [
        {
          courseCode: "Prof Ed 1",
          courseTitle: "The Child and Adolescent Learners",
          leadAuthor: "Maria Angelica C. Mugot",
          justification: "On official leave.",
        },
        {
          courseCode: "Prof Ed 1",
          courseTitle: "The Child and Adolescent Learners",
          leadAuthor: "Ben Cruz",
          justification: "Retired.",
        },
      ],
      facultyName: "Lea Santos",
      programChairName: "Paolo Reyes",
    });
  });

  it.each([
    ["Second Semester", "2nd Semester"],
    ["Summer", "Summer"],
  ])("prints %s as %s", (semester, printed) => {
    expect(buildJustificationLetter({ ...input, semester }).semester).toBe(printed);
  });

  it("transcribes the template's fixed wording", () => {
    expect(JUSTIFICATION_TEMPLATE.salutation).toBe("Dear Madam:");
    expect(JUSTIFICATION_TEMPLATE.columns).toEqual([
      "Course Code",
      "Course Title",
      "Lead Author",
      "Justification",
    ]);
    expect(
      `${JUSTIFICATION_TEMPLATE.opening.before}1st Semester${JUSTIFICATION_TEMPLATE.opening.between}SY 2024-2025${JUSTIFICATION_TEMPLATE.opening.after}`,
    ).toBe(
      "The undersigned wishes to inform your good office that the following syllabus/es for 1st Semester, SY 2024-2025 do/es not have the affixed signature of the Lead Faculty:",
    );
  });
});
