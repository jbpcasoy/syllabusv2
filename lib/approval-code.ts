import { FINAL_STAGE } from "@/lib/syllabus-workflow";
import type { Semester } from "@/types/term";

/**
 * Approval references printed beside wet signatures:
 * SYL-<yy><yy>-<sem>-<seq>-S<stage>, for example SYL-2627-1-0042-S3.
 * <seq> is the syllabus's ref_seq, unique per term, so every stage code of
 * one syllabus shares a prefix.
 */
export interface ApprovalCodeParts {
  /** "2026-2027" */
  schoolYearLabel: string;
  semester: Semester;
  refSeq: number;
  stage: number;
}

const SEMESTER_CODES: Record<Semester, string> = {
  "First Semester": "1",
  "Second Semester": "2",
  Summer: "M",
};

const SCHOOL_YEAR = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/;
const CODE = /^SYL-(\d{2})(\d{2})-([12M])-(\d{4,})-S(\d)$/;

const validStage = (stage: number) =>
  Number.isInteger(stage) && stage >= 1 && stage <= FINAL_STAGE;

export function approvalCode(parts: ApprovalCodeParts): string {
  const year = SCHOOL_YEAR.exec(parts.schoolYearLabel);
  if (!year) throw new Error(`Bad school year label: ${parts.schoolYearLabel}`);
  if (!Number.isInteger(parts.refSeq) || parts.refSeq < 1) {
    throw new Error(`Bad ref_seq: ${parts.refSeq}`);
  }
  if (!validStage(parts.stage)) throw new Error(`Bad stage: ${parts.stage}`);

  const seq = String(parts.refSeq).padStart(4, "0");
  return `SYL-${year[2]}${year[4]}-${SEMESTER_CODES[parts.semester]}-${seq}-S${parts.stage}`;
}

/** The parts of a well-formed code, or null. Assumes the 2000s. */
export function parseApprovalCode(code: string): ApprovalCodeParts | null {
  const match = CODE.exec(code.trim().toUpperCase());
  if (!match) return null;
  const [, from, to, semesterCode, seq, stageText] = match;
  const refSeq = Number(seq);
  const stage = Number(stageText);
  if (refSeq < 1 || !validStage(stage)) return null;

  const semester = (Object.keys(SEMESTER_CODES) as Semester[]).find(
    (s) => SEMESTER_CODES[s] === semesterCode,
  )!;
  return {
    schoolYearLabel: `20${from}-20${to}`,
    semester,
    refSeq,
    stage,
  };
}
