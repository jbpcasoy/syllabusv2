import type { ReviewPointsDefinition } from "@/lib/forms/types";

/**
 * CITL Syllabus Review: Suggestions and Action Taken, with the CITL
 * Syllabus Review Guide that Part B codes refer to.
 * Transcribed from docs/forms/citl-syllabus-review-action-taken.md.
 */
export const FORM18_REV01: ReviewPointsDefinition = {
  code: "CITL-F-018",
  revision: "01",
  title: "Syllabus Review Suggestion and Action Taken",
  issueDate: "July 14, 2025",
  partA: {
    title: "Program Review",
    certification:
      "I hereby certify that the information provided herein is accurate and complete, in accordance with the requirements of the Program Review.",
    signatories: [
      { role: "Lead Faculty/Course Instructor", signer: "lead" },
      { role: "Program Coordinator/Department Head", signer: 1 },
    ],
  },
  partB: {
    title: "CITL Review",
    signatories: [
      { role: "FDIS Chair", signer: 3 },
      { role: "CITL Director", signer: 4 },
    ],
    abbreviations: [
      { abbreviation: "CO", meaning: "Course Outcome" },
      { abbreviation: "SLO", meaning: "Specific Learning Outcome" },
      { abbreviation: "PAO", meaning: "Performance Assessment Output" },
      { abbreviation: "IAS", meaning: "Innovative Approaches and Strategies" },
      { abbreviation: "ICT", meaning: "ICT Tools and Resources" },
    ],
    legend: [
      {
        key: "A",
        title: "Format and House Style",
        description:
          "Ensure the syllabus follows the prescribed conventions in Form 17 (Review Checklist).",
        entries: [
          { code: "A.1", text: "Format: use the template prescribed by the university." },
          { code: "A.2", text: "Structure: present content in logical sections." },
          { code: "A.3", text: "Font style: Book Antiqua." },
          { code: "A.4", text: "Font size." },
          { code: "A.4.1", text: "Headings: 12 pt." },
          { code: "A.4.2", text: "Main text, page 1: 9 pt." },
          { code: "A.4.3", text: "Main text, succeeding pages: 11 pt." },
          { code: "A.5", text: "Line spacing: single throughout the document." },
        ],
      },
      {
        key: "B",
        title:
          "Alignment (Coherence and Logical Connection Between Learning Plan Components)",
        description:
          "Check coherence and logical connection between components of the learning plan (CO, SLO, PAO, IAS, ICT).",
        entries: [
          { code: "B.1", text: "CO and SLO" },
          { code: "B.2", text: "CO and PAO" },
          { code: "B.3", text: "CO and IAS" },
          { code: "B.4", text: "CO and ICT" },
          { code: "B.5", text: "SLO and IAS" },
          { code: "B.6", text: "SLO and ICT" },
        ],
      },
      {
        key: "C",
        title: "Use of Behavioral Verbs (Bloom's Taxonomy)",
        description: "Ensure outcomes are measurable and performance-based.",
        entries: [
          {
            code: "C.1",
            text: "All Course Outcomes begin with behavioral verbs (e.g., demonstrate, analyze, evaluate, formulate).",
          },
          {
            code: "C.2",
            text: "Specific Learning Outcomes are precise and observable.",
          },
        ],
      },
      {
        key: "D",
        title: "Gradation of COs and SLOs",
        description:
          "Verify that outcomes follow a clear hierarchical structure.",
        entries: [
          {
            code: "D.1",
            text: "Hierarchical COs: arranged in increasing level of complexity.",
          },
          {
            code: "D.2",
            text: "Overarching COs: COs that encapsulate the SLOs.",
          },
          { code: "D.3", text: "Foundational SLOs (lowest complexity)." },
          { code: "D.4", text: "Mediating SLOs (intermediate complexity)." },
          { code: "D.5", text: "Terminal/Ultimate SLOs (highest complexity)." },
        ],
      },
      {
        key: "E",
        title: "Supplementary Documentation",
        entries: [
          {
            code: "E.1",
            text: "Revision history: gives the month and year of previous revision(s) and the complete date of the present revision.",
          },
          {
            code: "E.2",
            text: "Signatories: lead faculty, department head, dean, CITL director, and VPAA.",
          },
          {
            code: "E.3",
            text: "Name(s) and signature(s) of the syllabus author(s) responsible for the present revision.",
          },
          {
            code: "E.4",
            text: "Reference list: complete and consistent, following APA 7th edition.",
          },
        ],
      },
      {
        key: "F",
        title: "Inclusion of Prescribed Institutional Forms",
        description:
          "Check that the following forms are included, reviewed, and filled in.",
        entries: [
          { code: "F.1", text: "Form 17: Syllabus Review Checklist" },
          {
            code: "F.2",
            text: "Form 18-1: Syllabus Review Suggestion and Action Taken",
          },
          {
            code: "F.3",
            text: "Justification Form (no affixed signature for lead faculty)",
          },
        ],
      },
    ],
  },
};
