/**
 * Form definitions live in code, one module per form code and revision.
 * Stored answers and points record the revision they used, so a review
 * stays readable after the university revises a form.
 */

/**
 * A printed signature line: the role as printed, and whose approval fills
 * it — a review stage (1 to 5) or the syllabus's lead.
 */
export interface Signatory {
  role: string;
  signer: number | "lead";
}

/** One Yes/No criterion of Form 17. */
export interface ChecklistCriterion {
  /** "A1" .. "I6", as printed. Stored in form17_answers.criterion. */
  key: string;
  /** Printed text, verbatim. */
  text: string;
  /** On-screen guidance for reviewers. Never printed. */
  hint?: string;
}

export interface ChecklistSection {
  /** "A" .. "I". */
  key: string;
  title: string;
  criteria: ChecklistCriterion[];
}

/** Form 17 (OVPAA-F-INS-017): the shared Yes/No checklist. */
export interface ChecklistDefinition {
  code: "OVPAA-F-INS-017";
  revision: string;
  title: string;
  issueDate: string;
  sections: ChecklistSection[];
  /** Sign-off lines printed under "Reviewed by", in order. */
  signatories: Signatory[];
}

/** One Part B review-point code, e.g. "B.3". */
export interface LegendEntry {
  code: string;
  text: string;
}

export interface LegendGroup {
  /** "A" .. "F". */
  key: string;
  title: string;
  description?: string;
  entries: LegendEntry[];
}

export interface ReviewPointsPart {
  title: string;
  /** Sign-off lines printed under the part, in order. */
  signatories: Signatory[];
}

/** Form 18-1 (CITL-F-018): review points with action taken. */
export interface ReviewPointsDefinition {
  code: "CITL-F-018";
  revision: string;
  title: string;
  issueDate: string;
  partA: ReviewPointsPart & { certification: string };
  /** Part B points must use a legend code. */
  partB: ReviewPointsPart & {
    abbreviations: { abbreviation: string; meaning: string }[];
    legend: LegendGroup[];
  };
}
