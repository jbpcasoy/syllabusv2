import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  heldStages,
  holdsStageFor,
  listAwaitingReviewIds,
  listNeedsProxy,
  loadQueueExtras,
  queueFilter,
  queueSort,
  queueStages,
  stageScopeFilter,
  statusFilter,
  toQueueItems,
} from "@/lib/review-queue";
import { NO_ROLES, type UserRoles } from "@/types/roles";
import type { Syllabus } from "@/types/syllabus";
import type PocketBase from "pocketbase";

const ME = "me1me1me1me1me1";
const OTHER = "othrothrothroth";
const PROGRAM = "prgAprgAprgAprg";
const COLLEGE = "colAcolAcolAcol";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));
const pb = { filter } as unknown as PocketBase;

const roles = (overrides: Partial<UserRoles> = {}): UserRoles => ({
  ...NO_ROLES,
  ...overrides,
});
const ALL_ROLES = roles({
  reviewerOfPrograms: [PROGRAM],
  deanOfColleges: [COLLEGE],
  isFdisChair: true,
  isCitlDirector: true,
  isVpaa: true,
});

describe("heldStages and queueStages", () => {
  it.each([
    [{ reviewerOfPrograms: [PROGRAM] }, [1]],
    [{ deanOfColleges: [COLLEGE] }, [2]],
    [{ isFdisChair: true }, [3]],
    [{ isCitlDirector: true }, [4]],
    [{ isVpaa: true }, [5]],
    [{ chairOfPrograms: [PROGRAM], headOfDepartments: ["d"] }, []],
    [{ isAdmin: true }, []],
  ])("holds %o as stages %o", (overrides, expected) => {
    expect(heldStages(roles(overrides))).toEqual(expected);
  });

  it("adds stand-in stages, sorted and without repeats", () => {
    expect(queueStages(roles({ isVpaa: true }), [2, 1, 2])).toEqual([1, 2, 5]);
  });

  it("gives an admin every stage", () => {
    expect(queueStages(roles({ isAdmin: true }), [])).toEqual([1, 2, 3, 4, 5]);
  });

  it("gives nothing to a user with no chain role or stand-in", () => {
    expect(queueStages(NO_ROLES, [])).toEqual([]);
  });
});

describe("stageScopeFilter", () => {
  it("limits stage 1 to the programs the user reviews", () => {
    expect(stageScopeFilter(pb, 1, ALL_ROLES, [])).toBe(
      `((program = "${PROGRAM}"))`,
    );
  });

  it("limits stage 2 to the dean's colleges", () => {
    expect(stageScopeFilter(pb, 2, ALL_ROLES, [])).toBe(
      `((program.department.college = "${COLLEGE}"))`,
    );
  });

  it.each([3, 4, 5])("leaves stage %i unconstrained for its holder", (stage) => {
    expect(stageScopeFilter(pb, stage, ALL_ROLES, [])).toBe("");
  });

  it("leaves every stage unconstrained for an admin", () => {
    for (const stage of [1, 2, 3, 4, 5]) {
      expect(stageScopeFilter(pb, stage, roles({ isAdmin: true }), [])).toBe("");
    }
  });

  it("adds the syllabi the user stands in for", () => {
    expect(stageScopeFilter(pb, 1, ALL_ROLES, ["s1"])).toBe(
      `((program = "${PROGRAM}") || (id = "s1"))`,
    );
    expect(stageScopeFilter(pb, 4, NO_ROLES, ["s1", "s2"])).toBe(
      `((id = "s1" || id = "s2"))`,
    );
  });

  it("matches nothing when the user has neither role nor stand-in there", () => {
    expect(stageScopeFilter(pb, 3, roles({ isVpaa: true }), [])).toBe("id = ''");
  });
});

describe("statusFilter and queueSort", () => {
  it.each([
    ["waiting", "(status = 'submitted' && stage = 2)"],
    ["returned", "(status = 'returned' && stage = 2)"],
    [
      "passed",
      "(((status = 'submitted' || status = 'returned') && stage > 2) || status = 'approved' || status = 'filed')",
    ],
  ] as const)("filters %s", (status, expected) => {
    expect(statusFilter(pb, 2, status)).toBe(expected);
  });

  it("serves waiting work oldest first and the rest newest first", () => {
    expect(queueSort("waiting")).toBe("status_changed_at,id");
    expect(queueSort("returned")).toBe("-status_changed_at,-id");
    expect(queueSort("passed")).toBe("-status_changed_at,-id");
  });
});

describe("queueFilter", () => {
  it("joins status, scope, the author exclusion and the filters", () => {
    expect(
      queueFilter(pb, {
        stage: 1,
        status: "waiting",
        me: ME,
        roles: ALL_ROLES,
        standIns: [
          { syllabus: "s1", stage: 1, user: ME },
          { syllabus: "s9", stage: 3, user: ME },
        ],
        program: PROGRAM,
        term: "trm",
        search: "IT 1",
      }),
    ).toBe(
      [
        "(status = 'submitted' && stage = 1)",
        `((program = "${PROGRAM}") || (id = "s1"))`,
        `lead != "${ME}" && co_authors:each != "${ME}"`,
        `program = "${PROGRAM}"`,
        `term = "trm"`,
        `(course.code ~ "IT 1" || course.title ~ "IT 1" || program.code ~ "IT 1")`,
      ].join(" && "),
    );
  });

  it("drops the scope when it is unconstrained", () => {
    expect(
      queueFilter(pb, {
        stage: 5,
        status: "passed",
        me: ME,
        roles: roles({ isVpaa: true }),
        standIns: [],
      }),
    ).toBe(
      `${statusFilter(pb, 5, "passed")} && lead != "${ME}" && co_authors:each != "${ME}"`,
    );
  });
});

const record = (overrides: Partial<Syllabus> = {}): Syllabus =>
  ({
    id: "syl",
    program: PROGRAM,
    lead: OTHER,
    co_authors: [],
    status: "submitted",
    stage: 2,
    expand: { program: { expand: { department: { college: COLLEGE } } } },
    ...overrides,
  }) as unknown as Syllabus;

describe("holdsStageFor", () => {
  it("checks the program at stage 1 and the college at stage 2", () => {
    expect(holdsStageFor(ALL_ROLES, 1, record())).toBe(true);
    expect(holdsStageFor(ALL_ROLES, 1, record({ program: "other" }))).toBe(false);
    expect(holdsStageFor(ALL_ROLES, 2, record())).toBe(true);
    expect(holdsStageFor(ALL_ROLES, 2, record({ expand: {} }))).toBe(false);
  });

  it("needs only the role at stages 3 to 5", () => {
    expect(holdsStageFor(roles({ isCitlDirector: true }), 4, record())).toBe(true);
    expect(holdsStageFor(roles({ isCitlDirector: true }), 5, record())).toBe(false);
  });

  it("never counts admin as a holder", () => {
    expect(holdsStageFor(roles({ isAdmin: true }), 3, record())).toBe(false);
  });
});

describe("toQueueItems", () => {
  const context = {
    stage: 2,
    me: ME,
    roles: roles({ deanOfColleges: [COLLEGE] }),
    covers: [],
    versionNos: new Map([["syl", 3]]),
  };

  it("marks a waiting syllabus actionable for its holder", () => {
    expect(toQueueItems([record()], context)).toEqual([
      expect.objectContaining({
        version_no: 3,
        actionable: true,
        covered_by: null,
        syllabus: expect.objectContaining({ id: "syl", access: "reviewer" }),
      }),
    ]);
  });

  it("is read-only past or before the stage", () => {
    const [passed] = toQueueItems([record({ stage: 3 })], context);
    const [returned] = toQueueItems([record({ status: "returned" })], context);
    expect(passed.actionable).toBe(false);
    expect(returned.actionable).toBe(false);
  });

  it("names the stand-in covering the stage for someone else", () => {
    const [item] = toQueueItems([record()], {
      ...context,
      covers: [
        { syllabus: "syl", stage: 2, user: OTHER, expand: { user: { name: "Ana" } } },
      ],
    });
    expect(item).toMatchObject({ actionable: false, covered_by: "Ana" });
  });

  it("lets the stand-in act even without the role", () => {
    const [item] = toQueueItems([record({ program: "else", expand: {} })], {
      ...context,
      roles: NO_ROLES,
      covers: [{ syllabus: "syl", stage: 2, user: ME }],
    });
    expect(item).toMatchObject({ actionable: true, covered_by: null });
  });

  it("never lets an admin act unless they hold the stage", () => {
    const [item] = toQueueItems([record()], {
      ...context,
      roles: roles({ isAdmin: true }),
    });
    expect(item.actionable).toBe(false);
    expect(item.syllabus.access).toBe("admin");
  });

  it("defaults the version number to 0", () => {
    const [item] = toQueueItems([record()], { ...context, versionNos: new Map() });
    expect(item.version_no).toBe(0);
  });
});

describe("loadQueueExtras", () => {
  it("queries nothing for an empty page", async () => {
    const collection = vi.fn();
    const result = await loadQueueExtras(
      { filter, collection } as unknown as PocketBase,
      [],
    );
    expect(result.covers).toEqual([]);
    expect(collection).not.toHaveBeenCalled();
  });

  it("keeps the highest version number per syllabus", async () => {
    const lists: Record<string, unknown[]> = {
      syllabus_stand_ins: [{ syllabus: "a", stage: 1, user: OTHER }],
      syllabus_versions: [
        { syllabus: "a", version_no: 1 },
        { syllabus: "a", version_no: 3 },
        { syllabus: "b", version_no: 2 },
      ],
    };
    const fake = {
      filter,
      collection: (name: string) => ({ getFullList: async () => lists[name] }),
    } as unknown as PocketBase;
    const { covers, versionNos } = await loadQueueExtras(fake, ["a", "b"]);
    expect(covers).toHaveLength(1);
    expect(versionNos).toEqual(new Map([["a", 3], ["b", 2]]));
  });
});

type Row = { id: string; stage: number; lead: string; co_authors: string[] };
type Cover = { syllabus: string; stage: number; user: string };

function fakePb(candidates: Row[], covers: Cover[] = []) {
  const syllabiList = vi.fn(async () => candidates);
  const standInsList = vi.fn(async (options: { filter: string }) =>
    options.filter.startsWith("user =")
      ? covers.filter((c) => c.user === ME)
      : covers,
  );
  const fake = {
    filter,
    collection: (name: string) => ({
      getFullList: name === "syllabi" ? syllabiList : standInsList,
    }),
  } as unknown as PocketBase;
  return { pb: fake, syllabiList, standInsList };
}

const row = (id: string, stage: number, extra: Partial<Row> = {}): Row => ({
  id,
  stage,
  lead: "leadleadleadlea",
  co_authors: [],
  ...extra,
});

describe("listAwaitingReviewIds", () => {
  it("queries nothing for a user with no chain role or stand-in", async () => {
    const { pb: fake, syllabiList } = fakePb([]);
    expect(await listAwaitingReviewIds(fake, ME, NO_ROLES)).toEqual([]);
    expect(syllabiList).not.toHaveBeenCalled();
  });

  it("queries nothing for an admin with no chain role", async () => {
    const { pb: fake, syllabiList } = fakePb([]);
    expect(await listAwaitingReviewIds(fake, ME, roles({ isAdmin: true }))).toEqual([]);
    expect(syllabiList).not.toHaveBeenCalled();
  });

  it("builds one clause per held stage, scoped", async () => {
    const { pb: fake, syllabiList } = fakePb([]);
    await listAwaitingReviewIds(fake, ME, ALL_ROLES);
    expect(syllabiList).toHaveBeenCalledWith({
      fields: "id,stage,lead,co_authors",
      filter: [
        `((status = 'submitted' && stage = 1) && ((program = "${PROGRAM}")))`,
        `((status = 'submitted' && stage = 2) && ((program.department.college = "${COLLEGE}")))`,
        "(status = 'submitted' && stage = 3)",
        "(status = 'submitted' && stage = 4)",
        "(status = 'submitted' && stage = 5)",
      ].join(" || "),
    });
  });

  it("adds the user's own stand-ins as exact stage matches", async () => {
    const { pb: fake, syllabiList } = fakePb([], [{ syllabus: "s1", stage: 2, user: ME }]);
    await listAwaitingReviewIds(fake, ME, NO_ROLES);
    expect(syllabiList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: `((status = 'submitted' && stage = 2) && ((id = "s1")))`,
      }),
    );
  });

  it("keeps matches, drops authored ones and stages covered by someone else", async () => {
    const { pb: fake } = fakePb(
      [
        row("held", 3),
        row("mine-as-co", 3, { co_authors: [ME] }),
        row("covered", 3),
        row("i-cover", 1),
      ],
      [
        { syllabus: "covered", stage: 3, user: OTHER },
        { syllabus: "i-cover", stage: 1, user: ME },
      ],
    );

    expect(
      await listAwaitingReviewIds(fake, ME, roles({ isFdisChair: true })),
    ).toEqual(["held", "i-cover"]);
  });

  it("ignores a stand-in for a different stage", async () => {
    const { pb: fake } = fakePb(
      [row("s", 3)],
      [{ syllabus: "s", stage: 4, user: OTHER }],
    );
    expect(
      await listAwaitingReviewIds(fake, ME, roles({ isFdisChair: true })),
    ).toEqual(["s"]);
  });
});

describe("listNeedsProxy", () => {
  const REVIEWER = "revwrevwrevwrev";
  // Drafts, plus syllabi waiting at or returned from stage 1.
  const STAGE_ONE_AHEAD =
    "(status = 'draft' || ((status = 'submitted' || status = 'returned') && stage = 1))";
  type Draft = { id: string; program: string; lead: string; co_authors: string[] };
  const draft = (id: string, extra: Partial<Draft> = {}): Draft => ({
    id,
    program: PROGRAM,
    lead: "leadleadleadlea",
    co_authors: [],
    ...extra,
  });

  function needsProxyPb(drafts: Draft[], proxied: string[] = []) {
    const reviewersList = vi.fn(async () => [{ user: REVIEWER, program: PROGRAM }]);
    // The first syllabi call reads authors; the second loads the rows.
    const syllabiList = vi.fn(async (options: { fields?: string; filter: string }) =>
      options.fields
        ? drafts
        : drafts.filter((d) => options.filter.includes(`"${d.id}"`)),
    );
    const standInsList = vi.fn(async () => proxied.map((syllabus) => ({ syllabus })));
    const fake = {
      filter,
      collection: (name: string) => ({
        getFullList:
          name === "program_reviewers"
            ? reviewersList
            : name === "syllabi"
              ? syllabiList
              : standInsList,
      }),
    } as unknown as PocketBase;
    return { pb: fake, reviewersList, syllabiList, standInsList };
  }

  it("queries nothing for a user who can't name a proxy", async () => {
    const { pb: fake, reviewersList } = needsProxyPb([]);
    const none = roles({
      chairOfPrograms: [PROGRAM],
      headOfDepartments: ["deptdeptdeptdep"],
      facultyOfPrograms: [PROGRAM],
    });
    expect(await listNeedsProxy(fake, ME, none)).toEqual([]);
    expect(reviewersList).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a dean to their college",
      { deanOfColleges: [COLLEGE] },
      `((program.department.college = "${COLLEGE}"))`,
    ],
    [
      "a program reviewer to their programs",
      { reviewerOfPrograms: [PROGRAM] },
      `((program = "${PROGRAM}"))`,
    ],
    [
      "a dean who also reviews to both",
      { deanOfColleges: [COLLEGE], reviewerOfPrograms: [PROGRAM] },
      `((program.department.college = "${COLLEGE}") || (program = "${PROGRAM}"))`,
    ],
  ])("scopes %s", async (_, overrides, scope) => {
    const { pb: fake, reviewersList, syllabiList } = needsProxyPb([]);
    await listNeedsProxy(fake, ME, roles(overrides));
    expect(reviewersList).toHaveBeenCalledWith({
      fields: "user,program",
      filter: `active = true && ${scope}`,
    });
    expect(syllabiList).toHaveBeenCalledWith({
      fields: "id,program,lead,co_authors",
      filter: `${STAGE_ONE_AHEAD} && ${scope}`,
    });
  });

  it("shows the conflicted program reviewer their own drafts", async () => {
    const { pb: fake } = needsProxyPb([
      draft("rev-co", { co_authors: [REVIEWER] }),
      draft("no-conflict"),
    ]);
    const items = await listNeedsProxy(
      fake,
      REVIEWER,
      roles({ reviewerOfPrograms: [PROGRAM] }),
    );
    expect(items.map((s) => [s.id, s.access])).toEqual([["rev-co", "coAuthor"]]);
  });

  it.each([
    ["admin", { isAdmin: true }],
    ["FDIS chair", { isFdisChair: true }],
    ["CITL director", { isCitlDirector: true }],
    ["VPAA", { isVpaa: true }],
  ])("sees every program as %s", async (_, overrides) => {
    const { pb: fake, syllabiList } = needsProxyPb([]);
    await listNeedsProxy(fake, ME, roles(overrides));
    expect(syllabiList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: STAGE_ONE_AHEAD }),
    );
  });

  it("keeps drafts the reviewer writes without a proxy, oldest first", async () => {
    const { pb: fake, syllabiList, standInsList } = needsProxyPb(
      [
        draft("rev-leads", { lead: REVIEWER }),
        draft("rev-co", { co_authors: [REVIEWER] }),
        draft("has-proxy", { co_authors: [REVIEWER] }),
        draft("no-conflict"),
        draft("other-program", { program: "othrprogothrpro", lead: REVIEWER }),
        draft("mine", { lead: ME, co_authors: [REVIEWER] }),
      ],
      ["has-proxy"],
    );

    const items = await listNeedsProxy(fake, ME, roles({ isVpaa: true }));

    expect(items.map((s) => [s.id, s.access])).toEqual([
      ["rev-leads", "designator"],
      ["rev-co", "designator"],
      ["mine", "lead"],
    ]);
    expect(standInsList).toHaveBeenCalledWith({
      fields: "syllabus",
      filter: `stage = 1 && (syllabus = "rev-leads" || syllabus = "rev-co" || syllabus = "has-proxy" || syllabus = "mine")`,
    });
    expect(syllabiList).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: "created,id" }),
    );
  });

  it("labels an admin's rows as admin access", async () => {
    const { pb: fake } = needsProxyPb([draft("a", { lead: REVIEWER })]);
    const items = await listNeedsProxy(fake, ME, roles({ isAdmin: true }));
    expect(items.map((s) => s.access)).toEqual(["admin"]);
  });

  it("skips the stand-in lookup when nothing is conflicted", async () => {
    const { pb: fake, standInsList } = needsProxyPb([draft("a")]);
    expect(await listNeedsProxy(fake, ME, roles({ isVpaa: true }))).toEqual([]);
    expect(standInsList).not.toHaveBeenCalled();
  });
});
