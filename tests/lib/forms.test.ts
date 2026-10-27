import {
  checklistCriteria,
  CURRENT_FORM17,
  CURRENT_FORM18,
  form17Status,
  getForm17,
  getForm18,
  isLegendCode,
  legendEntries,
  partForStage,
} from "@/lib/forms";
import { describe, expect, it } from "vitest";

describe("Form 17 (OVPAA-F-INS-017)", () => {
  const criteria = checklistCriteria(CURRENT_FORM17);

  it("is revision 04", () => {
    expect(CURRENT_FORM17).toMatchObject({
      code: "OVPAA-F-INS-017",
      revision: "04",
      issueDate: "February 5, 2025",
    });
  });

  it("has 43 criteria in 9 sections, A to I", () => {
    expect(CURRENT_FORM17.sections.map((s) => s.key)).toEqual([
      "A", "B", "C", "D", "E", "F", "G", "H", "I",
    ]);
    expect(CURRENT_FORM17.sections.map((s) => s.criteria.length)).toEqual([
      3, 7, 4, 4, 5, 6, 4, 4, 6,
    ]);
    expect(criteria).toHaveLength(43);
  });

  it("numbers each criterion within its section, uniquely", () => {
    for (const section of CURRENT_FORM17.sections) {
      expect(section.criteria.map((c) => c.key)).toEqual(
        section.criteria.map((_, i) => `${section.key}${i + 1}`),
      );
    }
    expect(new Set(criteria.map((c) => c.key)).size).toBe(43);
  });

  it("has printed text for every criterion", () => {
    for (const criterion of criteria) {
      expect(criterion.text.trim().length).toBeGreaterThan(5);
    }
  });

  it("maps each printed sign-off role to the stage that signs it", () => {
    expect(CURRENT_FORM17.signatories).toEqual([
      { role: "Program Chair / Department Head", signer: 1 },
      { role: "College Dean", signer: 2 },
      { role: "CITL Director", signer: 4 },
      { role: "Vice President for Academic Affairs", signer: 5 },
    ]);
  });
});

describe("Form 18-1 (CITL-F-018)", () => {
  const codes = legendEntries(CURRENT_FORM18).map((e) => e.code);

  it("is revision 01", () => {
    expect(CURRENT_FORM18).toMatchObject({
      code: "CITL-F-018",
      revision: "01",
      issueDate: "July 14, 2025",
    });
  });

  it("has the legend groups A to F with their codes", () => {
    expect(CURRENT_FORM18.partB.legend.map((g) => g.key)).toEqual([
      "A", "B", "C", "D", "E", "F",
    ]);
    expect(codes).toEqual([
      "A.1", "A.2", "A.3", "A.4", "A.4.1", "A.4.2", "A.4.3", "A.5",
      "B.1", "B.2", "B.3", "B.4", "B.5", "B.6",
      "C.1", "C.2",
      "D.1", "D.2", "D.3", "D.4", "D.5",
      "E.1", "E.2", "E.3", "E.4",
      "F.1", "F.2", "F.3",
    ]);
  });

  it("maps each part's sign-off lines to the lead or a stage", () => {
    expect(CURRENT_FORM18.partA.signatories.map((s) => s.signer)).toEqual(["lead", 1]);
    expect(CURRENT_FORM18.partB.signatories.map((s) => s.signer)).toEqual([3, 4]);
  });

  it("prefixes every code with its group", () => {
    for (const group of CURRENT_FORM18.partB.legend) {
      for (const entry of group.entries) {
        expect(entry.code.startsWith(`${group.key}.`)).toBe(true);
      }
    }
  });

  it.each([
    ["B.3", true],
    ["A.4.2", true],
    ["F.3", true],
    ["G.1", false],
    ["B3", false],
    ["", false],
  ])("isLegendCode(%j) → %s", (code, expected) => {
    expect(isLegendCode(CURRENT_FORM18, code)).toBe(expected);
  });
});

describe("revisions", () => {
  it("resolves the current revisions and nothing else", () => {
    expect(getForm17("04")).toBe(CURRENT_FORM17);
    expect(getForm18("01")).toBe(CURRENT_FORM18);
    expect(getForm17("03")).toBeNull();
    expect(getForm18("")).toBeNull();
  });
});

describe("form17Status", () => {
  const all = checklistCriteria(CURRENT_FORM17).map((c) => ({
    criterion: c.key,
    answer: "yes",
  }));

  it("is complete with every criterion answered Yes", () => {
    expect(form17Status(CURRENT_FORM17, all)).toEqual({
      complete: true,
      hasNo: false,
      missing: [],
    });
  });

  it("lists unanswered criteria in printed order", () => {
    const partial = all.filter((a) => !["A2", "I6", "C1"].includes(a.criterion));
    expect(form17Status(CURRENT_FORM17, partial)).toMatchObject({
      complete: false,
      missing: ["A2", "C1", "I6"],
    });
  });

  it("flags any No", () => {
    const withNo = all.map((a) =>
      a.criterion === "F6" ? { ...a, answer: "no" } : a,
    );
    expect(form17Status(CURRENT_FORM17, withNo)).toMatchObject({
      complete: true,
      hasNo: true,
    });
  });

  it("ignores answers to criteria the form doesn't have", () => {
    expect(
      form17Status(CURRENT_FORM17, [{ criterion: "Z9", answer: "yes" }]).missing,
    ).toHaveLength(43);
  });
});

describe("partForStage", () => {
  it.each([
    [1, "A"],
    [2, "A"],
    [3, "B"],
    [4, "B"],
    [5, "B"],
  ])("stage %i writes Part %s", (stage, part) => {
    expect(partForStage(stage)).toBe(part);
  });
});
