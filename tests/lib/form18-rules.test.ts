import {
  pointActionError,
  pointCodeError,
  pointFacts,
  type PointAction,
} from "@/lib/form18-rules";
import { CURRENT_FORM18 } from "@/lib/forms";
import type { PointStatus } from "@/types/form18";
import { describe, expect, it } from "vitest";

const LATEST = "v2v2v2v2v2v2v2v";
const OLDER = "v1v1v1v1v1v1v1v";

const point = (status: PointStatus, stage = 2, version = LATEST) => ({
  id: `${status}-${stage}`,
  stage,
  status,
  version,
});

describe("pointFacts", () => {
  const points = [
    point("open"),
    point("open"),
    point("responded"),
    point("unresolved"),
    point("resolved"),
    point("open", 3),
  ];

  it("counts only the stage's points", () => {
    expect(pointFacts(points, 2)).toEqual({
      openPoints: 3,
      unjudgedPoints: 1,
      pendingPoints: 4,
      unansweredPoints: 2,
      unresolvedIds: ["unresolved-2"],
    });
    expect(pointFacts(points, 3).openPoints).toBe(1);
    expect(pointFacts(points, 5)).toEqual({
      openPoints: 0,
      unjudgedPoints: 0,
      pendingPoints: 0,
      unansweredPoints: 0,
      unresolvedIds: [],
    });
  });

  it("treats only resolved points as settled", () => {
    expect(pointFacts([point("resolved"), point("resolved")], 2).pendingPoints).toBe(0);
  });
});

describe("pointCodeError", () => {
  it.each([1, 2])("refuses a code in Part A (stage %i)", (stage) => {
    expect(pointCodeError(CURRENT_FORM18, stage, "")).toBeNull();
    expect(pointCodeError(CURRENT_FORM18, stage, "B.1")).toBe(
      "Part A review points don't take a code.",
    );
  });

  it.each([3, 4, 5])("needs a legend code in Part B (stage %i)", (stage) => {
    expect(pointCodeError(CURRENT_FORM18, stage, "B.3")).toBeNull();
    expect(pointCodeError(CURRENT_FORM18, stage, "A.4.2")).toBeNull();
    expect(pointCodeError(CURRENT_FORM18, stage, "")).toBe(
      "Part B review points need a code from the legend.",
    );
    expect(pointCodeError(CURRENT_FORM18, stage, "G.1")).toBe(
      "Unknown legend code: G.1",
    );
  });
});

describe("pointActionError", () => {
  const inReview = { status: "submitted" as const, stage: 2 };
  const returned = { status: "returned" as const, stage: 2 };
  const allowed = (
    action: PointAction,
    p: ReturnType<typeof point>,
    syllabus: { status: "draft" | "submitted" | "returned" | "approved" | "filed"; stage: number },
  ) => pointActionError(action, p, syllabus, LATEST) === null;

  it.each(["edit", "delete"] as const)("%s: only an open point of this round", (action) => {
    expect(allowed(action, point("open"), inReview)).toBe(true);
    expect(allowed(action, point("open", 2, OLDER), inReview)).toBe(false);
    expect(allowed(action, point("responded"), inReview)).toBe(false);
    expect(allowed(action, point("open"), returned)).toBe(false);
    expect(allowed(action, point("open", 1), inReview)).toBe(false);
    expect(pointActionError(action, point("resolved"), inReview, LATEST)).toBe(
      "A review point can only be changed before you return the syllabus.",
    );
  });

  it("respond: open or answered points of the returning stage", () => {
    expect(allowed("respond", point("open", 2, OLDER), returned)).toBe(true);
    expect(allowed("respond", point("responded", 2, OLDER), returned)).toBe(true);
    expect(allowed("respond", point("resolved"), returned)).toBe(false);
    expect(allowed("respond", point("unresolved"), returned)).toBe(false);
    expect(allowed("respond", point("open", 1), returned)).toBe(false);
    expect(allowed("respond", point("open"), inReview)).toBe(false);
    expect(pointActionError("respond", point("open"), inReview, LATEST)).toBe(
      "Only open points of the stage that returned the syllabus can be answered.",
    );
  });

  it("judge: answered points of the stage under review, re-judging allowed", () => {
    for (const status of ["responded", "resolved", "unresolved"] as const) {
      expect(allowed("judge", point(status, 2, OLDER), inReview)).toBe(true);
    }
    expect(allowed("judge", point("open"), inReview)).toBe(false);
    expect(allowed("judge", point("responded"), returned)).toBe(false);
    expect(allowed("judge", point("responded", 3), inReview)).toBe(false);
    expect(pointActionError("judge", point("open"), inReview, LATEST)).toBe(
      "Only points the lead has answered can be marked resolved or unresolved.",
    );
  });

  it.each(["edit", "delete", "respond", "judge"] as const)(
    "%s: nothing once approved or filed",
    (action) => {
      for (const status of ["approved", "filed"] as const) {
        expect(allowed(action, point("responded"), { status, stage: 2 })).toBe(false);
      }
    },
  );
});
