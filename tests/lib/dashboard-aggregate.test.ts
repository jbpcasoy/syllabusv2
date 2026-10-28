import { aggregate } from "@/lib/dashboard-aggregate";
import type { ProgramOrg, TermSlots } from "@/types/dashboard";
import { describe, expect, it } from "vitest";

const program = (
  id: string,
  code: string,
  departmentId: string,
  collegeId: string,
): ProgramOrg => ({
  id,
  code,
  name: `Program ${code}`,
  departmentId,
  departmentName: `Department ${departmentId}`,
  collegeId,
  collegeName: `College ${collegeId}`,
});

const IT = program("pIT", "BSIT", "dIT", "cCOT");
const EMC = program("pEMC", "BSEMC", "dIT", "cCOT");
const NURSING = program("pN", "BSN", "dN", "cCON");

const NO_DEADLINES = { submission_deadline: "", review_days: 0 };
const NOW = new Date("2026-12-10T00:00:00.000Z");

const slots = (partial: Partial<TermSlots>): TermSlots => ({
  programs: [IT, EMC, NURSING],
  expected: [],
  syllabi: [],
  references: [],
  ...partial,
});
const syllabus = (
  programId: string,
  course: string,
  status: TermSlots["syllabi"][number]["status"],
  stage = 0,
  status_changed_at = "",
) => ({ program: programId, course, status, stage, status_changed_at });

describe("aggregate counts", () => {
  it("counts each status, and waiting per stage", () => {
    const { counts } = aggregate(
      slots({
        syllabi: [
          syllabus("pIT", "c1", "draft"),
          syllabus("pIT", "c2", "submitted", 1),
          syllabus("pIT", "c3", "submitted", 1),
          syllabus("pEMC", "c1", "submitted", 3),
          syllabus("pEMC", "c2", "submitted", 5),
          syllabus("pN", "c1", "returned", 2),
          syllabus("pN", "c2", "approved", 5),
          syllabus("pN", "c3", "filed", 5),
        ],
      }),
      NO_DEADLINES,
      NOW,
    );
    expect(counts).toEqual({
      notStarted: 0,
      draft: 1,
      waiting: [2, 0, 1, 0, 1],
      returned: 1,
      approved: 1,
      filed: 1,
      referenced: 0,
      overdueSubmission: 0,
      overdueReview: 0,
    });
  });

  it("counts expected slots with nothing as not started, and references apart", () => {
    const { counts } = aggregate(
      slots({
        expected: [
          { program: "pIT", course: "c1" },
          { program: "pIT", course: "c2" },
          { program: "pIT", course: "c3" },
        ],
        syllabi: [syllabus("pIT", "c1", "draft")],
        references: [{ program: "pIT", course: "c2", sourceStatus: "submitted" }],
      }),
      NO_DEADLINES,
      NOW,
    );
    expect(counts).toMatchObject({ notStarted: 1, draft: 1, referenced: 1 });
  });

  it("ignores rows of programs outside the ones given", () => {
    const { counts, completion } = aggregate(
      slots({
        programs: [IT],
        expected: [{ program: "pN", course: "c1" }],
        syllabi: [syllabus("pN", "c1", "filed", 5)],
        references: [{ program: "pN", course: "c2", sourceStatus: "filed" }],
      }),
      NO_DEADLINES,
      NOW,
    );
    expect(counts).toMatchObject({ filed: 0, notStarted: 0, referenced: 0 });
    expect(completion.map((r) => r.id)).toEqual(["cCOT", "dIT", "pIT"]);
  });

  it("counts a duplicated expected slot once", () => {
    const { completion } = aggregate(
      slots({
        programs: [IT],
        expected: [
          { program: "pIT", course: "c1" },
          { program: "pIT", course: "c1" },
        ],
      }),
      NO_DEADLINES,
      NOW,
    );
    expect(completion.find((r) => r.id === "pIT")?.expected).toBe(1);
  });
});

describe("aggregate overdue", () => {
  const term = { submission_deadline: "2026-12-01", review_days: 3 };

  it("counts slots with nothing submitted after the deadline", () => {
    const { counts, completion } = aggregate(
      slots({
        programs: [IT],
        expected: [
          { program: "pIT", course: "empty" },
          { program: "pIT", course: "draft" },
          { program: "pIT", course: "submitted" },
          { program: "pIT", course: "referenced" },
        ],
        syllabi: [
          syllabus("pIT", "draft", "draft"),
          syllabus("pIT", "submitted", "submitted", 1, "2026-12-09 00:00:00.000Z"),
        ],
        references: [{ program: "pIT", course: "referenced", sourceStatus: "draft" }],
      }),
      term,
      NOW,
    );
    expect(counts.overdueSubmission).toBe(2);
    expect(completion.find((r) => r.id === "pIT")?.overdueSubmission).toBe(2);
  });

  it("counts nothing before the deadline ends in PHT", () => {
    const { counts } = aggregate(
      slots({ programs: [IT], expected: [{ program: "pIT", course: "empty" }] }),
      term,
      new Date("2026-12-01T15:59:59.999Z"),
    );
    expect(counts.overdueSubmission).toBe(0);
  });

  it("counts submitted syllabi waiting past the review limit", () => {
    const { counts, completion } = aggregate(
      slots({
        syllabi: [
          syllabus("pIT", "late", "submitted", 2, "2026-12-01 00:00:00.000Z"),
          syllabus("pIT", "fresh", "submitted", 2, "2026-12-09 00:00:00.000Z"),
          syllabus("pN", "returned", "returned", 2, "2026-11-01 00:00:00.000Z"),
        ],
      }),
      term,
      NOW,
    );
    expect(counts.overdueReview).toBe(1);
    expect(completion.find((r) => r.id === "pIT")?.overdueReview).toBe(1);
    expect(completion.find((r) => r.id === "pN")?.overdueReview).toBe(0);
  });
});

describe("aggregate completion", () => {
  const { completion } = aggregate(
    slots({
      expected: [
        { program: "pIT", course: "c1" },
        { program: "pIT", course: "c2" },
        { program: "pIT", course: "c3" },
        { program: "pIT", course: "c4" },
        { program: "pEMC", course: "c1" },
        { program: "pEMC", course: "c2" },
      ],
      syllabi: [
        syllabus("pIT", "c1", "filed", 5),
        syllabus("pIT", "c2", "approved", 5),
        syllabus("pEMC", "c1", "filed", 5),
        // Not in the prospectus: counted by stage, not in completion.
        syllabus("pIT", "extra", "filed", 5),
      ],
      references: [
        { program: "pIT", course: "c3", sourceStatus: "filed" },
        { program: "pEMC", course: "c2", sourceStatus: "approved" },
      ],
    }),
    NO_DEADLINES,
    NOW,
  );
  const byId = (id: string) => completion.find((r) => r.id === id);

  it("divides filed slots by expected slots, a filed reference counting as filed", () => {
    expect(byId("pIT")).toMatchObject({ expected: 4, filed: 2, rate: 0.5 });
    expect(byId("pEMC")).toMatchObject({ expected: 2, filed: 1, rate: 0.5 });
  });

  it("rolls programs up into their department and college", () => {
    expect(byId("dIT")).toMatchObject({ level: "department", expected: 6, filed: 3, rate: 0.5, parentId: "cCOT" });
    expect(byId("cCOT")).toMatchObject({ level: "college", expected: 6, filed: 3, rate: 0.5, parentId: "" });
  });

  it("shows no rate, not 0% or 100%, when nothing is expected", () => {
    expect(byId("pN")).toMatchObject({ expected: 0, filed: 0, rate: null });
    expect(byId("cCON")).toMatchObject({ rate: null });
  });

  it("orders each college, then its departments, then their programs, by name", () => {
    expect(completion.map((r) => [r.level, r.id])).toEqual([
      ["college", "cCON"],
      ["department", "dN"],
      ["program", "pN"],
      ["college", "cCOT"],
      ["department", "dIT"],
      ["program", "pEMC"],
      ["program", "pIT"],
    ]);
  });

  it("names programs by code and name", () => {
    expect(byId("pIT")?.name).toBe("BSIT · Program BSIT");
  });
});
