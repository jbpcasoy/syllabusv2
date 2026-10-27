import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listAwaitingReviewIds } from "@/lib/syllabus-queue";
import { NO_ROLES, type UserRoles } from "@/types/roles";
import type PocketBase from "pocketbase";

const ME = "me1me1me1me1me1";
const OTHER = "othrothrothroth";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

type Row = { id: string; stage: number; lead: string; co_authors: string[] };
type Cover = { syllabus: string; stage: number; user: string };

function fakePb(candidates: Row[], covers: Cover[] = []) {
  const syllabiList = vi.fn(async () => candidates);
  const standInsList = vi.fn(async (options: { filter: string }) =>
    options.filter.startsWith("user =")
      ? covers.filter((c) => c.user === ME)
      : covers,
  );
  const pb = {
    filter,
    collection: (name: string) => ({
      getFullList: name === "syllabi" ? syllabiList : standInsList,
    }),
  } as unknown as PocketBase;
  return { pb, syllabiList, standInsList };
}

const row = (id: string, stage: number, extra: Partial<Row> = {}): Row => ({
  id,
  stage,
  lead: "leadleadleadlea",
  co_authors: [],
  ...extra,
});

const roles = (overrides: Partial<UserRoles>): UserRoles => ({
  ...NO_ROLES,
  ...overrides,
});

describe("listAwaitingReviewIds", () => {
  it("queries nothing for a user with no chain role or stand-in", async () => {
    const { pb, syllabiList } = fakePb([]);
    expect(await listAwaitingReviewIds(pb, ME, NO_ROLES)).toEqual([]);
    expect(syllabiList).not.toHaveBeenCalled();
  });

  it("builds one clause per held stage, scoped", async () => {
    const { pb, syllabiList } = fakePb([]);
    await listAwaitingReviewIds(
      pb,
      ME,
      roles({
        reviewerOfPrograms: ["prgAprgAprgAprg"],
        deanOfColleges: ["colAcolAcolAcol"],
        isFdisChair: true,
        isCitlDirector: true,
        isVpaa: true,
      }),
    );
    expect(syllabiList).toHaveBeenCalledWith({
      fields: "id,stage,lead,co_authors",
      filter:
        `status = 'submitted' && ((stage = 1 && (program = "prgAprgAprgAprg")) || ` +
        `(stage = 2 && (program.department.college = "colAcolAcolAcol")) || ` +
        `stage = 3 || stage = 4 || stage = 5)`,
    });
  });

  it("adds the user's own stand-ins as exact stage matches", async () => {
    const { pb, syllabiList } = fakePb([], [{ syllabus: "s1", stage: 2, user: ME }]);
    await listAwaitingReviewIds(pb, ME, NO_ROLES);
    expect(syllabiList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: `status = 'submitted' && ((id = "s1" && stage = 2))`,
      }),
    );
  });

  it("keeps matches, drops authored ones and stages covered by someone else", async () => {
    const { pb } = fakePb(
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
      await listAwaitingReviewIds(pb, ME, roles({ isFdisChair: true })),
    ).toEqual(["held", "i-cover"]);
  });

  it("ignores a stand-in for a different stage", async () => {
    const { pb } = fakePb(
      [row("s", 3)],
      [{ syllabus: "s", stage: 4, user: OTHER }],
    );
    expect(
      await listAwaitingReviewIds(pb, ME, roles({ isFdisChair: true })),
    ).toEqual(["s"]);
  });
});
