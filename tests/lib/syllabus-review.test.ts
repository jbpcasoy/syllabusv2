import {
  canDesignate,
  isAuthor,
  isPersonalReviewer,
  isReviewer,
  needsStandIn,
  proxyNeeded,
  resolveActor,
  reviewContext,
  standInWindowError,
  type ChainHolders,
  type StandIn,
} from "@/lib/syllabus-review";
import { describe, expect, it } from "vitest";

const LEAD = "leadleadleadlea";
const CO = "cocococococococ";
/** Stage 1: the program chair or department head, by program level. */
const PROGRAM_REVIEWER = "progprogprogpro";
const DEAN = "deandeandeandea";
const FDIS = "fdisfdisfdisfdi";
const CITL = "citlcitlcitlcit";
const VPAA = "vpaavpaavpaavpa";
const PROXY = "proxyproxyproxy";
const OTHER = "othrothrothroth";

const HOLDERS: ChainHolders = [[PROGRAM_REVIEWER], [DEAN], [FDIS], [CITL], [VPAA]];
const BY_STAGE = [PROGRAM_REVIEWER, DEAN, FDIS, CITL, VPAA];
const STAGES = [1, 2, 3, 4, 5];

const syllabus = (
  stage: number,
  status: "draft" | "submitted" | "returned" | "approved" | "filed" = "submitted",
  coAuthors: string[] = [CO],
  lead = LEAD,
) => ({ status, stage, lead, co_authors: coAuthors });

describe("isAuthor", () => {
  it.each([
    [LEAD, true],
    [CO, true],
    [PROGRAM_REVIEWER, false],
  ])("%s → %s", (user, expected) => {
    expect(isAuthor(user, syllabus(1))).toBe(expected);
  });
});

describe("resolveActor", () => {
  it.each(STAGES)("lets the stage %i holder act as holder", (stage) => {
    expect(resolveActor(BY_STAGE[stage - 1], syllabus(stage), HOLDERS, [])).toEqual({
      stage,
      actingAs: "holder",
    });
  });

  it("refuses holders of other stages", () => {
    for (const user of [PROGRAM_REVIEWER, FDIS, CITL, VPAA, OTHER]) {
      expect(resolveActor(user, syllabus(2), HOLDERS, [])).toBeNull();
    }
  });

  it.each(["draft", "returned", "approved", "filed"] as const)(
    "lets nobody act while %s",
    (status) => {
      expect(resolveActor(DEAN, syllabus(2, status), HOLDERS, [])).toBeNull();
    },
  );

  it("never lets an author act, even as the holder", () => {
    const reviewerLeads = syllabus(1, "submitted", [], PROGRAM_REVIEWER);
    expect(resolveActor(PROGRAM_REVIEWER, reviewerLeads, HOLDERS, [])).toBeNull();
    const deanCoAuthors = syllabus(2, "submitted", [DEAN]);
    expect(resolveActor(DEAN, deanCoAuthors, HOLDERS, [])).toBeNull();
  });

  it("lets the stage-1 stand-in act as proxy and shuts out the holder", () => {
    const standIns: StandIn[] = [{ stage: 1, user: PROXY }];
    expect(resolveActor(PROXY, syllabus(1), HOLDERS, standIns)).toEqual({
      stage: 1,
      actingAs: "proxy",
    });
    expect(resolveActor(PROGRAM_REVIEWER, syllabus(1), HOLDERS, standIns)).toBeNull();
  });

  it("lets a later-stage stand-in act and shuts out the holder", () => {
    const standIns: StandIn[] = [{ stage: 3, user: OTHER }];
    expect(resolveActor(OTHER, syllabus(3), HOLDERS, standIns)).toEqual({
      stage: 3,
      actingAs: "standIn",
    });
    expect(resolveActor(FDIS, syllabus(3), HOLDERS, standIns)).toBeNull();
  });

  it("ignores stand-ins for other stages", () => {
    const standIns: StandIn[] = [{ stage: 4, user: OTHER }];
    expect(resolveActor(OTHER, syllabus(3), HOLDERS, standIns)).toBeNull();
    expect(resolveActor(FDIS, syllabus(3), HOLDERS, standIns)).toEqual({
      stage: 3,
      actingAs: "holder",
    });
  });

  it("refuses a stand-in who has since become an author", () => {
    const standIns: StandIn[] = [{ stage: 2, user: CO }];
    expect(resolveActor(CO, syllabus(2), HOLDERS, standIns)).toBeNull();
  });

  it("refuses everyone when the stage has no holder", () => {
    const holders: ChainHolders = [[PROGRAM_REVIEWER], [], [FDIS], [CITL], [VPAA]];
    expect(resolveActor(DEAN, syllabus(2), holders, [])).toBeNull();
  });
});

describe("needsStandIn", () => {
  it("is false when the holder is not an author", () => {
    expect(needsStandIn(1, syllabus(0, "draft"), HOLDERS, [])).toBe(false);
  });

  it("is true when the program reviewer leads or co-authors and no proxy is set", () => {
    expect(
      needsStandIn(1, syllabus(0, "draft", [], PROGRAM_REVIEWER), HOLDERS, []),
    ).toBe(true);
    expect(
      needsStandIn(1, syllabus(0, "draft", [PROGRAM_REVIEWER]), HOLDERS, []),
    ).toBe(true);
  });

  it("is false once a stand-in covers the stage", () => {
    expect(
      needsStandIn(1, syllabus(0, "draft", [PROGRAM_REVIEWER]), HOLDERS, [
        { stage: 1, user: PROXY },
      ]),
    ).toBe(false);
  });

  it("is true for a later conflicted stage too", () => {
    expect(needsStandIn(5, syllabus(5, "submitted", [VPAA]), HOLDERS, [])).toBe(true);
  });

  it("is false when another holder of the stage is not an author", () => {
    const holders: ChainHolders = [
      [PROGRAM_REVIEWER, OTHER],
      [DEAN],
      [FDIS],
      [CITL],
      [VPAA],
    ];
    expect(
      needsStandIn(1, syllabus(0, "draft", [PROGRAM_REVIEWER]), holders, []),
    ).toBe(false);
  });

  it("is false for an empty stage (the missing-role check covers it)", () => {
    const holders: ChainHolders = [[], [DEAN], [FDIS], [CITL], [VPAA]];
    expect(needsStandIn(1, syllabus(0, "draft"), holders, [])).toBe(false);
  });
});

describe("canDesignate", () => {
  it.each(STAGES)("lets an admin designate for stage %i", (stage) => {
    expect(canDesignate(OTHER, true, stage, HOLDERS)).toBe(true);
  });

  it("lets the program reviewer name their own proxy", () => {
    expect(canDesignate(PROGRAM_REVIEWER, false, 1, HOLDERS)).toBe(true);
  });

  // Rows: stage needing a stand-in; columns: holder of each stage 1 to 5.
  it.each([
    [1, [true, true, true, true, true]],
    [2, [false, false, true, true, true]],
    [3, [false, false, false, true, true]],
    [4, [false, false, false, false, true]],
    [5, [false, false, false, false, false]],
  ])("for stage %i only later holders designate", (stage, expected) => {
    expect(BY_STAGE.map((user) => canDesignate(user, false, stage, HOLDERS))).toEqual(
      expected,
    );
  });

  it("refuses a user with no chain role", () => {
    expect(canDesignate(OTHER, false, 1, HOLDERS)).toBe(false);
  });
});

describe("standInWindowError", () => {
  it("lets the proxy be named while drafting", () => {
    expect(standInWindowError(syllabus(0, "draft"), 1)).toBeNull();
  });

  it.each([2, 3, 4, 5])("waits for submission before stage %i", (stage) => {
    expect(standInWindowError(syllabus(0, "draft"), stage)).toBe(
      "Stand-ins for later stages can be set once the syllabus is submitted.",
    );
  });

  it.each(["submitted", "returned"] as const)(
    "allows the current and later stages while %s",
    (status) => {
      for (const stage of [3, 4, 5]) {
        expect(standInWindowError(syllabus(3, status), stage)).toBeNull();
      }
    },
  );

  it.each(["submitted", "returned"] as const)(
    "refuses a stage that has passed while %s",
    (status) => {
      for (const stage of [1, 2]) {
        expect(standInWindowError(syllabus(3, status), stage)).toBe(
          "That stage has already passed.",
        );
      }
    },
  );

  it.each(["approved", "filed"] as const)("refuses every stage once %s", (status) => {
    for (const stage of STAGES) {
      expect(standInWindowError(syllabus(5, status), stage)).toBe(
        "Stand-ins can't change after the syllabus is approved.",
      );
    }
  });
});

describe("proxyNeeded", () => {
  const conflicted = (stage: number, status: Parameters<typeof syllabus>[1]) =>
    syllabus(stage, status, [PROGRAM_REVIEWER]);

  it.each([
    ["a draft", conflicted(0, "draft")],
    ["waiting at stage 1", conflicted(1, "submitted")],
    ["returned at stage 1", conflicted(1, "returned")],
  ])("is true for %s the program reviewer writes", (_, routed) => {
    expect(proxyNeeded(routed, HOLDERS, [])).toBe(true);
  });

  it("is true when the program reviewer leads", () => {
    const led = syllabus(1, "submitted", [], PROGRAM_REVIEWER);
    expect(proxyNeeded(led, HOLDERS, [])).toBe(true);
  });

  it.each([
    ["past stage 1", conflicted(2, "submitted")],
    ["returned later", conflicted(3, "returned")],
    ["approved", conflicted(5, "approved")],
    ["filed", conflicted(5, "filed")],
  ])("is false once stage 1 is decided: %s", (_, routed) => {
    expect(proxyNeeded(routed, HOLDERS, [])).toBe(false);
  });

  it("is false once a proxy is set", () => {
    expect(
      proxyNeeded(conflicted(1, "submitted"), HOLDERS, [{ stage: 1, user: PROXY }]),
    ).toBe(false);
  });

  it("is false when the program reviewer isn't an author", () => {
    expect(proxyNeeded(syllabus(1), HOLDERS, [])).toBe(false);
  });
});

describe("reviewContext", () => {
  it("tells the current reviewer they may decide", () => {
    expect(reviewContext(DEAN, false, syllabus(2), HOLDERS, [])).toEqual({
      actorStage: 2,
      actingAs: "holder",
      designatableStages: [],
      proxyNeeded: false,
    });
  });

  it("lists the stages a later holder may cover, skipping passed ones", () => {
    expect(reviewContext(VPAA, false, syllabus(3), HOLDERS, [])).toEqual({
      actorStage: null,
      actingAs: null,
      designatableStages: [3, 4],
      proxyNeeded: false,
    });
  });

  it("lets an admin cover every open stage but never decide", () => {
    expect(reviewContext(OTHER, true, syllabus(1), HOLDERS, [])).toEqual({
      actorStage: null,
      actingAs: null,
      designatableStages: [1, 2, 3, 4, 5],
      proxyNeeded: false,
    });
  });

  it("offers only the proxy while drafting, and says one is needed", () => {
    const draft = syllabus(0, "draft", [PROGRAM_REVIEWER]);
    expect(reviewContext(PROGRAM_REVIEWER, false, draft, HOLDERS, [])).toEqual({
      actorStage: null,
      actingAs: null,
      designatableStages: [1],
      proxyNeeded: true,
    });
  });

  it("refuses the authoring program reviewer at stage 1 and says a proxy is needed", () => {
    const routed = syllabus(1, "submitted", [PROGRAM_REVIEWER]);
    expect(reviewContext(PROGRAM_REVIEWER, false, routed, HOLDERS, [])).toEqual({
      actorStage: null,
      actingAs: null,
      designatableStages: [1],
      proxyNeeded: true,
    });
  });

  it("offers nothing once approved", () => {
    expect(
      reviewContext(OTHER, true, syllabus(5, "approved"), HOLDERS, [])
        .designatableStages,
    ).toEqual([]);
  });

  it("reports the proxy's capacity", () => {
    expect(
      reviewContext(PROXY, false, syllabus(1), HOLDERS, [{ stage: 1, user: PROXY }]),
    ).toMatchObject({ actorStage: 1, actingAs: "proxy" });
  });
});

describe("isReviewer", () => {
  it.each(BY_STAGE)("includes chain holder %s once out of draft", (user) => {
    expect(isReviewer(user, syllabus(1), HOLDERS, [])).toBe(true);
  });

  it("includes stand-ins of any stage", () => {
    expect(isReviewer(PROXY, syllabus(3), HOLDERS, [{ stage: 1, user: PROXY }])).toBe(
      true,
    );
  });

  it.each(["returned", "approved", "filed"] as const)("still holds while %s", (status) => {
    expect(isReviewer(DEAN, syllabus(5, status), HOLDERS, [])).toBe(true);
  });

  it("excludes everyone while a draft", () => {
    expect(isReviewer(PROGRAM_REVIEWER, syllabus(0, "draft"), HOLDERS, [])).toBe(false);
    expect(
      isReviewer(PROXY, syllabus(0, "draft"), HOLDERS, [{ stage: 1, user: PROXY }]),
    ).toBe(false);
  });

  it("excludes outsiders", () => {
    expect(isReviewer(OTHER, syllabus(2), HOLDERS, [])).toBe(false);
  });
});

describe("isPersonalReviewer", () => {
  it("is true for a stand-in at any stage", () => {
    expect(isPersonalReviewer(OTHER, [{ stage: 4, user: OTHER }], [])).toBe(true);
  });

  it("is true for anyone who has decided", () => {
    expect(isPersonalReviewer(DEAN, [], [PROGRAM_REVIEWER, DEAN])).toBe(true);
  });

  it("is false otherwise, even for a chain holder who hasn't decided", () => {
    expect(isPersonalReviewer(FDIS, [{ stage: 1, user: OTHER }], [DEAN])).toBe(
      false,
    );
  });
});
