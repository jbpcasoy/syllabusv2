import type { ActingAs } from "@/lib/syllabus-review";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import type {
  ChecklistDefinition,
  ReviewPointsDefinition,
  Signatory,
} from "./types";

/**
 * Everything a document export (docx-js) needs to print a form, already
 * resolved: no ids to look up, no definitions to consult. Pure builders;
 * lib/forms-export.ts loads the data and the export routes serve it.
 */

export const INSTITUTION = {
  name: "Bukidnon State University",
  address: "Malaybalay City, Bukidnon 8700",
} as const;

export interface ExportFormMeta {
  code: string;
  revision: string;
  title: string;
  issueDate: string;
}

export interface ExportSyllabus {
  courseCode: string;
  courseTitle: string;
  programCode: string;
  programName: string;
  schoolYearLabel: string;
  semester: string;
  leadName: string;
  coAuthorNames: string[];
}

/** The latest approval at a stage, from syllabus_reviews. */
export interface ApprovalStamp {
  stage: number;
  reviewerName: string;
  actingAs: ActingAs;
  approvalCode: string;
  /** PocketBase datetime. */
  approvedAt: string;
}

/**
 * One printed signature line. Approved lines carry the approver, time and
 * code to print beside the wet signature; the rest stay blank.
 */
export interface ExportSignature {
  role: string;
  /** The stage that signs it, or null for the lead's line. */
  stage: number | null;
  name: string;
  /** "" when the line isn't approved yet (or is the lead's). */
  approvedAt: string;
  approvalCode: string;
  /** Set when a proxy or stand-in approved in the holder's place. */
  actingAs: ActingAs | null;
}

export interface Form17ExportData {
  form: ExportFormMeta;
  institution: typeof INSTITUTION;
  /** The review header printed at the top of the checklist. */
  header: {
    /** The stage-1 approver, or "" before approval. */
    reviewerName: string;
    /** PocketBase datetime of that approval, or "". */
    dateOfReview: string;
    courseCode: string;
    courseTitle: string;
    /** Lead first, then co-authors. */
    instructors: string[];
  };
  syllabus: ExportSyllabus & { versionNo: number };
  sections: {
    key: string;
    title: string;
    criteria: {
      key: string;
      text: string;
      answer: "yes" | "no" | null;
      remarks: string;
    }[];
  }[];
  suggestions: string;
  signatures: ExportSignature[];
}

export interface ExportPoint {
  stage: number;
  stageLabel: string;
  /** "" in Part A. */
  code: string;
  /** The legend text for the code; "" in Part A. */
  codeText: string;
  reviewPoint: string;
  actionTaken: string;
  pageNumber: string;
  remarks: string;
  status: string;
}

/** For legend F.3: whether a Justification Form applies and where it stands. */
export type JustificationState =
  | "not_applicable"
  | "missing"
  | "draft"
  | "submitted"
  | "returned";

export interface Form181ExportData {
  form: ExportFormMeta;
  institution: typeof INSTITUTION;
  header: { courseCode: string; courseTitle: string };
  syllabus: ExportSyllabus;
  /** Pre-fills F.3 ("Justification Form"); null for callers who may not see it. */
  justification: JustificationState | null;
  partA: {
    title: string;
    certification: string;
    points: ExportPoint[];
    signatures: ExportSignature[];
  };
  partB: {
    title: string;
    points: ExportPoint[];
    signatures: ExportSignature[];
    abbreviations: { abbreviation: string; meaning: string }[];
    legend: ReviewPointsDefinition["partB"]["legend"];
  };
}

function signatures(
  lines: Signatory[],
  syllabus: ExportSyllabus,
  approvals: readonly ApprovalStamp[],
): ExportSignature[] {
  return lines.map(({ role, signer }) => {
    if (signer === "lead") {
      return {
        role,
        stage: null,
        name: syllabus.leadName,
        approvedAt: "",
        approvalCode: "",
        actingAs: null,
      };
    }
    const approval = approvals.find((a) => a.stage === signer);
    return {
      role,
      stage: signer,
      name: approval?.reviewerName ?? "",
      approvedAt: approval?.approvedAt ?? "",
      approvalCode: approval?.approvalCode ?? "",
      actingAs:
        approval && approval.actingAs !== "holder" ? approval.actingAs : null,
    };
  });
}

const meta = (form: ChecklistDefinition | ReviewPointsDefinition): ExportFormMeta => ({
  code: form.code,
  revision: form.revision,
  title: form.title,
  issueDate: form.issueDate,
});

export function buildForm17Export(input: {
  definition: ChecklistDefinition;
  syllabus: ExportSyllabus;
  versionNo: number;
  answers: readonly { criterion: string; answer: "yes" | "no"; remarks: string }[];
  suggestions: string;
  approvals: readonly ApprovalStamp[];
}): Form17ExportData {
  const { definition, syllabus, approvals } = input;
  const byCriterion = new Map(input.answers.map((a) => [a.criterion, a]));
  const reviewer = approvals.find((a) => a.stage === 1);

  return {
    form: meta(definition),
    institution: INSTITUTION,
    header: {
      reviewerName: reviewer?.reviewerName ?? "",
      dateOfReview: reviewer?.approvedAt ?? "",
      courseCode: syllabus.courseCode,
      courseTitle: syllabus.courseTitle,
      instructors: [syllabus.leadName, ...syllabus.coAuthorNames].filter(Boolean),
    },
    syllabus: { ...syllabus, versionNo: input.versionNo },
    sections: definition.sections.map((section) => ({
      key: section.key,
      title: section.title,
      criteria: section.criteria.map((criterion) => {
        const answer = byCriterion.get(criterion.key);
        return {
          key: criterion.key,
          text: criterion.text,
          answer: answer?.answer ?? null,
          remarks: answer?.remarks ?? "",
        };
      }),
    })),
    suggestions: input.suggestions,
    signatures: signatures(definition.signatories, syllabus, approvals),
  };
}

export function buildForm181Export(input: {
  definition: ReviewPointsDefinition;
  syllabus: ExportSyllabus;
  points: readonly {
    part: "A" | "B";
    stage: number;
    code: string;
    review_point: string;
    action_taken: string;
    page_number: string;
    remarks: string;
    status: string;
  }[];
  approvals: readonly ApprovalStamp[];
  justification: JustificationState | null;
}): Form181ExportData {
  const { definition, syllabus, approvals } = input;
  const codeText = new Map(
    definition.partB.legend.flatMap((g) => g.entries).map((e) => [e.code, e.text]),
  );
  const toExport = (point: (typeof input.points)[number]): ExportPoint => ({
    stage: point.stage,
    stageLabel: CHAIN_ROLES[point.stage - 1]?.label ?? "",
    code: point.code,
    codeText: codeText.get(point.code) ?? "",
    reviewPoint: point.review_point,
    actionTaken: point.action_taken,
    pageNumber: point.page_number,
    remarks: point.remarks,
    status: point.status,
  });
  const inPart = (part: "A" | "B") =>
    input.points.filter((p) => p.part === part).map(toExport);

  return {
    form: meta(definition),
    institution: INSTITUTION,
    header: { courseCode: syllabus.courseCode, courseTitle: syllabus.courseTitle },
    syllabus,
    justification: input.justification,
    partA: {
      title: definition.partA.title,
      certification: definition.partA.certification,
      points: inPart("A"),
      signatures: signatures(definition.partA.signatories, syllabus, approvals),
    },
    partB: {
      title: definition.partB.title,
      points: inPart("B"),
      signatures: signatures(definition.partB.signatories, syllabus, approvals),
      abbreviations: definition.partB.abbreviations,
      legend: definition.partB.legend,
    },
  };
}
