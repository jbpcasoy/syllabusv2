import { CURRENT_FORM17, CURRENT_FORM18 } from "@/lib/forms";
import {
  buildForm17Export,
  buildForm181Export,
  INSTITUTION,
  type ApprovalStamp,
  type ExportSyllabus,
} from "@/lib/forms/export";
import { describe, expect, it } from "vitest";

const SYLLABUS: ExportSyllabus = {
  courseCode: "IT 101",
  courseTitle: "Intro",
  programCode: "BSIT",
  programName: "BS Information Technology",
  schoolYearLabel: "2026-2027",
  semester: "First Semester",
  leadName: "Lea",
  coAuthorNames: ["Cole"],
};

const stamp = (stage: number, extra: Partial<ApprovalStamp> = {}): ApprovalStamp => ({
  stage,
  reviewerName: `Reviewer ${stage}`,
  actingAs: "holder",
  approvalCode: `SYL-2627-1-0007-S${stage}`,
  approvedAt: `2026-10-2${stage} 08:00:00.000Z`,
  ...extra,
});

describe("buildForm17Export", () => {
  const data = buildForm17Export({
    definition: CURRENT_FORM17,
    syllabus: SYLLABUS,
    versionNo: 2,
    answers: [
      { criterion: "A1", answer: "yes", remarks: "" },
      { criterion: "F6", answer: "no", remarks: "Only 3 references." },
    ],
    suggestions: "Add references.",
    approvals: [stamp(1), stamp(2, { actingAs: "standIn" }), stamp(3)],
  });

  it("carries the form meta and institution", () => {
    expect(data.form).toEqual({
      code: "OVPAA-F-INS-017",
      revision: "04",
      title: CURRENT_FORM17.title,
      issueDate: "February 5, 2025",
    });
    expect(data.institution).toBe(INSTITUTION);
  });

  it("fills the review header from the stage-1 approval", () => {
    expect(data.header).toEqual({
      reviewerName: "Reviewer 1",
      dateOfReview: "2026-10-21 08:00:00.000Z",
      courseCode: "IT 101",
      courseTitle: "Intro",
      instructors: ["Lea", "Cole"],
    });
    expect(data.syllabus.versionNo).toBe(2);
  });

  it("lists every criterion with its text and answer, unanswered as null", () => {
    const criteria = data.sections.flatMap((s) => s.criteria);
    expect(criteria).toHaveLength(43);
    expect(criteria.find((c) => c.key === "A1")).toEqual({
      key: "A1",
      text: "The course code, course title, credit units, and time duration are indicated.",
      answer: "yes",
      remarks: "",
    });
    expect(criteria.find((c) => c.key === "F6")).toMatchObject({
      answer: "no",
      remarks: "Only 3 references.",
    });
    expect(criteria.find((c) => c.key === "I6")).toMatchObject({
      answer: null,
      remarks: "",
    });
    expect(data.suggestions).toBe("Add references.");
  });

  it("fills signed lines and leaves unapproved ones blank", () => {
    expect(data.signatures).toEqual([
      {
        role: "Program Chair / Department Head",
        stage: 1,
        name: "Reviewer 1",
        approvedAt: "2026-10-21 08:00:00.000Z",
        approvalCode: "SYL-2627-1-0007-S1",
        actingAs: null,
      },
      {
        role: "College Dean",
        stage: 2,
        name: "Reviewer 2",
        approvedAt: "2026-10-22 08:00:00.000Z",
        approvalCode: "SYL-2627-1-0007-S2",
        actingAs: "standIn",
      },
      {
        role: "CITL Director",
        stage: 4,
        name: "",
        approvedAt: "",
        approvalCode: "",
        actingAs: null,
      },
      {
        role: "Vice President for Academic Affairs",
        stage: 5,
        name: "",
        approvedAt: "",
        approvalCode: "",
        actingAs: null,
      },
    ]);
  });

  it("leaves the reviewer header blank before any approval", () => {
    const blank = buildForm17Export({
      definition: CURRENT_FORM17,
      syllabus: { ...SYLLABUS, coAuthorNames: [] },
      versionNo: 1,
      answers: [],
      suggestions: "",
      approvals: [],
    });
    expect(blank.header).toMatchObject({
      reviewerName: "",
      dateOfReview: "",
      instructors: ["Lea"],
    });
  });
});

describe("buildForm181Export", () => {
  const point = (part: "A" | "B", stage: number, code = "") => ({
    part,
    stage,
    code,
    review_point: `Point at ${stage}`,
    action_taken: "Fixed.",
    page_number: "3",
    remarks: "",
    status: "resolved",
  });

  const data = buildForm181Export({
    definition: CURRENT_FORM18,
    syllabus: SYLLABUS,
    points: [point("A", 1), point("B", 3, "B.3"), point("A", 2)],
    approvals: [stamp(1), stamp(3, { actingAs: "proxy" })],
    justification: "submitted",
  });

  it("carries the justification state for F.3", () => {
    expect(data.justification).toBe("submitted");
  });

  it("splits points into parts with stage labels and legend text", () => {
    expect(data.partA.points.map((p) => p.stage)).toEqual([1, 2]);
    expect(data.partA.points[0]).toEqual({
      stage: 1,
      stageLabel: "Program Reviewer",
      code: "",
      codeText: "",
      reviewPoint: "Point at 1",
      actionTaken: "Fixed.",
      pageNumber: "3",
      remarks: "",
      status: "resolved",
    });
    expect(data.partB.points[0]).toMatchObject({
      stage: 3,
      stageLabel: "FDIS Chair",
      code: "B.3",
      codeText: "CO and IAS",
    });
  });

  it("signs Part A with the lead and the program reviewer", () => {
    expect(data.partA.signatures).toEqual([
      {
        role: "Lead Faculty/Course Instructor",
        stage: null,
        name: "Lea",
        approvedAt: "",
        approvalCode: "",
        actingAs: null,
      },
      expect.objectContaining({
        role: "Program Coordinator/Department Head",
        stage: 1,
        approvalCode: "SYL-2627-1-0007-S1",
      }),
    ]);
    expect(data.partA.certification).toBe(CURRENT_FORM18.partA.certification);
  });

  it("signs Part B with the FDIS chair and CITL director", () => {
    expect(data.partB.signatures).toEqual([
      expect.objectContaining({ role: "FDIS Chair", stage: 3, actingAs: "proxy" }),
      expect.objectContaining({ role: "CITL Director", stage: 4, name: "" }),
    ]);
    expect(data.partB.legend).toBe(CURRENT_FORM18.partB.legend);
    expect(data.partB.abbreviations).toHaveLength(5);
  });

  it("carries the header and form meta", () => {
    expect(data.header).toEqual({ courseCode: "IT 101", courseTitle: "Intro" });
    expect(data.form).toMatchObject({ code: "CITL-F-018", revision: "01" });
  });
});
