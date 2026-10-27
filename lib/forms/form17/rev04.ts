import type { ChecklistDefinition } from "@/lib/forms/types";

/**
 * OBE Syllabus for Hybrid Flexible Learning: Review Checklist.
 * Transcribed from docs/forms/obe-syllabus-review-checklist.md.
 */
export const FORM17_REV04: ChecklistDefinition = {
  code: "OVPAA-F-INS-017",
  revision: "04",
  title: "OBE Syllabus for Hybrid Flexible Learning Review Checklist",
  issueDate: "February 5, 2025",
  sections: [
    {
      key: "A",
      title: "Preliminaries",
      criteria: [
        {
          key: "A1",
          text: "The course code, course title, credit units, and time duration are indicated.",
        },
        { key: "A2", text: "The prerequisite(s) is/are specified." },
        { key: "A3", text: "The course description is clearly stated." },
      ],
    },
    {
      key: "B",
      title: "Vision, Mission, Goals, Objectives, and Outcomes",
      criteria: [
        {
          key: "B1",
          text: "The vision, mission, quality policy, institutional outcomes, and core values of the university are accurately stated.",
        },
        {
          key: "B2",
          text: "The course and specific outcomes describe competencies that are measurable as indicated by specific and active verbs.",
        },
        {
          key: "B3",
          text: "The outcomes address the most essential learning competencies.",
        },
        { key: "B4", text: "The learning outcomes are student-centered." },
        {
          key: "B5",
          text: "The learning outcomes are attainable and realistic in a remote learning set-up.",
        },
        {
          key: "B6",
          text: "The learning outcomes are arranged logically: (a) Complexity (lowest to highest level of learning taxonomy); (b) Domain (knowledge, skills, values).",
          hint: "Both (a) and (b) must hold to answer Yes.",
        },
        {
          key: "B7",
          text: "The learning outcomes are constructively aligned with the vision, mission, quality policy, institutional outcomes, and core values.",
        },
      ],
    },
    {
      key: "C",
      title: "Course Content",
      criteria: [
        {
          key: "C1",
          text: "The Learning Plan specifies ALL of the following: (a) Schedule; (b) Course Outcomes; (c) Specific Learning Outcomes; (d) Performance Assessment Outputs; (e) Innovative Approaches and Strategies; (f) ICT Tools/Resources; (g) Required Readings; (h) Teacher's Notes.",
          hint: "All eight sub-items (a to h) must be present to answer Yes. List any missing ones in Remarks.",
        },
        {
          key: "C2",
          text: "The course outcomes are constructively aligned with the specific learning outcomes.",
        },
        {
          key: "C3",
          text: "The course content mainstreams innovative and ethical leadership, cultural and natural heritage, gender and development, DRRM and climate change, futures thinking and foresight, entrepreneurial and green mindset, or other sustainable development goals in the curriculum.",
        },
        {
          key: "C4",
          text: "The course outcomes are constructively aligned with the performance assessment tasks/activities.",
        },
      ],
    },
    {
      key: "D",
      title: "Assessment",
      criteria: [
        { key: "D1", text: "Assessment tools and tasks are performance-based." },
        {
          key: "D2",
          text: "Assessment tasks are aligned with the course and specific learning outcomes.",
        },
        {
          key: "D3",
          text: "Assessment tasks are varied to accommodate learners' needs.",
        },
        { key: "D4", text: "Evaluation/Grading System is clearly stated." },
      ],
    },
    {
      key: "E",
      title: "Learning Modality and Methods",
      criteria: [
        {
          key: "E1",
          text: "Hybrid flexible teaching and learning modalities are used.",
        },
        {
          key: "E2",
          text: "Teaching and learning modalities foster inclusivity and equitability.",
        },
        {
          key: "E3",
          text: "Teaching and learning methods/strategies are relevant to hybrid flexible learning.",
        },
        {
          key: "E4",
          text: "Teaching and learning methods/strategies are innovative.",
        },
        {
          key: "E5",
          text: "Teaching and learning methods/strategies emphasize 21st century competencies.",
        },
      ],
    },
    {
      key: "F",
      title: "Resources, Required Readings, and References",
      criteria: [
        {
          key: "F1",
          text: "Hybrid flexible learning materials are incorporated, including classroom-based, offline-online, wired-non-wired, synchronous-asynchronous, responsive to the learners.",
        },
        { key: "F2", text: "Required readings and references are relevant." },
        { key: "F3", text: "References are accessible to the students." },
        {
          key: "F4",
          text: "References and other resources are of recent edition.",
        },
        {
          key: "F5",
          text: "The reference list follows the latest edition of the APA.",
        },
        {
          key: "F6",
          text: "There are five references and 10 e-books/online resources listed.",
          hint: "Needs at least 5 references and 10 e-books/online resources. State the counts in Remarks.",
        },
      ],
    },
    {
      key: "G",
      title: "Policies",
      criteria: [
        {
          key: "G1",
          text: "Policies are responsive to the flexible learning system.",
        },
        {
          key: "G2",
          text: "Policy on academic integrity, including AI use, is stipulated.",
        },
        {
          key: "G3",
          text: "Policy identifies the learning management system, communication, and collaborating tools to be used.",
        },
        {
          key: "G4",
          text: "Policies specify the etiquette in using technology tools and platforms.",
        },
      ],
    },
    {
      key: "H",
      title: "Other Required Information",
      criteria: [
        { key: "H1", text: "Revision history is indicated." },
        { key: "H2", text: "Instructor's name is indicated." },
        {
          key: "H3",
          text: "The names of the recommending approval are indicated: (a) Program Chair/Department Head; (b) Dean; (c) CITL Director; (d) VPAA.",
          hint: "All four names (a to d) must be present to answer Yes.",
        },
        {
          key: "H4",
          text: "The syllabus adheres to the University Document Control standards.",
        },
      ],
    },
    {
      key: "I",
      title: "House Style",
      criteria: [
        { key: "I1", text: "Paper size: A4" },
        { key: "I2", text: "Paper orientation: landscape" },
        { key: "I3", text: "Line spacing: single" },
        {
          key: "I4",
          text: "Margin: 1 inch on right, left, top, and bottom",
        },
        { key: "I5", text: "Font: Book Antiqua" },
        {
          key: "I6",
          text: "Headings: 12 pt; Text: 11 pt (except Page 1, which uses 9 pt font size)",
        },
      ],
    },
  ],
  // The printed chair/head line is signed by the Program Reviewer (stage 1).
  signatories: [
    { role: "Program Chair / Department Head", signer: 1 },
    { role: "College Dean", signer: 2 },
    { role: "CITL Director", signer: 4 },
    { role: "Vice President for Academic Affairs", signer: 5 },
  ],
};
