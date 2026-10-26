import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  applyDuplicate,
  batchSize,
  newRecordId,
  planDuplicate,
  toProspectusDuplicateResponse,
  type DuplicatePlan,
} from "@/lib/prospectus-duplicate";
import type PocketBase from "pocketbase";

const input = {
  program: "prog1prog1prog1",
  source_school_year: "sy2026sy2026sy2",
  target_school_year: "sy2027sy2027sy2",
};

const source = {
  id: "sourcesourcesou",
  program: input.program,
  school_year: input.source_school_year,
  published: true,
  expand: {
    program: { id: input.program, name: "BS Computer Science", code: "BSCS" },
    school_year: { id: input.source_school_year, label: "2026-2027" },
  },
};
const targetYear = { id: input.target_school_year, label: "2027-2028" };

function item(course: string, year_level: string, semester: string) {
  return {
    id: `item-${course}`,
    course,
    year_level,
    semester,
    expand: { course: { id: course, code: course.toUpperCase(), title: course } },
  };
}

/** Fake client: records calls and answers from the given fixtures. */
function fakePb(fixtures: {
  target?: { id: string; published: boolean } | null;
  sourceItems: ReturnType<typeof item>[];
  targetItems?: { course: string }[];
}) {
  const calls = {
    getFirstListItem: vi.fn(async () => source),
    getOne: vi.fn(async () => targetYear),
    getList: vi.fn(async () => ({
      items: fixtures.target ? [fixtures.target] : [],
    })),
    getFullList: vi.fn(async (options: { filter: string }) =>
      options.filter.includes(source.id)
        ? [...fixtures.sourceItems]
        : (fixtures.targetItems ?? []),
    ),
    create: vi.fn(),
    send: vi.fn(async () => []),
  };
  const pb = {
    filter: (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
    collection: () => calls,
    createBatch: () => ({
      collection: (name: string) => ({
        create: (body: unknown) => calls.create(name, body),
      }),
      send: calls.send,
    }),
  };
  return { pb: pb as unknown as PocketBase, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("planDuplicate", () => {
  it("copies everything into a target that doesn't exist yet", async () => {
    const { pb, calls } = fakePb({
      target: null,
      sourceItems: [item("cs101", "First Year", "First Semester")],
    });

    const plan = await planDuplicate(pb, input);

    expect(plan.target).toBeNull();
    expect(plan.copy.map((i) => i.course)).toEqual(["cs101"]);
    expect(plan.skip).toEqual([]);
    // Only the source items are loaded when there is no target.
    expect(calls.getFullList).toHaveBeenCalledTimes(1);
  });

  it("skips courses the existing target already lists", async () => {
    const { pb } = fakePb({
      target: { id: "targettargettar", published: false },
      sourceItems: [
        item("cs101", "First Year", "First Semester"),
        item("cs102", "First Year", "Second Semester"),
      ],
      targetItems: [{ course: "cs101" }],
    });

    const plan = await planDuplicate(pb, input);

    expect(plan.copy.map((i) => i.course)).toEqual(["cs102"]);
    expect(plan.skip.map((i) => i.course)).toEqual(["cs101"]);
  });

  it("orders items by curriculum (year level, then semester), not alphabetically", async () => {
    const { pb } = fakePb({
      target: null,
      sourceItems: [
        item("a", "Fourth Year", "First Semester"),
        item("b", "Second Year", "Summer"),
        item("c", "Second Year", "First Semester"),
        item("d", "First Year", "Second Semester"),
      ],
    });

    const plan = await planDuplicate(pb, input);

    expect(plan.copy.map((i) => i.course)).toEqual(["d", "c", "b", "a"]);
  });

  it("binds the program and both school years in its filters", async () => {
    const { pb, calls } = fakePb({ target: null, sourceItems: [] });

    await planDuplicate(pb, input);

    expect(calls.getFirstListItem).toHaveBeenCalledWith(
      `program = {:program} && school_year = {:schoolYear}|${JSON.stringify({
        program: input.program,
        schoolYear: input.source_school_year,
      })}`,
      { expand: "program,school_year" },
    );
    expect(calls.getOne).toHaveBeenCalledWith(input.target_school_year);
  });

  it("propagates PocketBase's 404 for a missing source", async () => {
    const { pb, calls } = fakePb({ target: null, sourceItems: [] });
    calls.getFirstListItem.mockRejectedValue({ status: 404 });

    await expect(planDuplicate(pb, input)).rejects.toEqual({ status: 404 });
  });
});

describe("applyDuplicate", () => {
  function plan(overrides: Partial<DuplicatePlan> = {}): DuplicatePlan {
    return {
      input,
      source: source as unknown as DuplicatePlan["source"],
      targetSchoolYear: targetYear as DuplicatePlan["targetSchoolYear"],
      target: null,
      copy: [
        item("cs101", "First Year", "First Semester"),
      ] as unknown as DuplicatePlan["copy"],
      skip: [],
      ...overrides,
    };
  }

  it("creates an unpublished prospectus and its items in one batch", async () => {
    const { pb, calls } = fakePb({ sourceItems: [] });

    const id = await applyDuplicate(pb, plan());

    expect(id).toMatch(/^[a-z0-9]{15}$/);
    expect(calls.create).toHaveBeenNthCalledWith(1, "prospectuses", {
      id,
      program: input.program,
      school_year: input.target_school_year,
      published: false,
    });
    expect(calls.create).toHaveBeenNthCalledWith(2, "prospectus_items", {
      prospectus: id,
      course: "cs101",
      year_level: "First Year",
      semester: "First Semester",
    });
    expect(calls.send).toHaveBeenCalledOnce();
  });

  it("adds items to an existing target without recreating it", async () => {
    const { pb, calls } = fakePb({ sourceItems: [] });
    const existing = { id: "targettargettar", published: true };

    const id = await applyDuplicate(
      pb,
      plan({ target: existing as unknown as DuplicatePlan["target"] }),
    );

    expect(id).toBe(existing.id);
    expect(calls.create).toHaveBeenCalledTimes(1);
    expect(calls.create).toHaveBeenCalledWith(
      "prospectus_items",
      expect.objectContaining({ prospectus: existing.id }),
    );
  });

  it("lets a failed batch reject (nothing is applied)", async () => {
    const { pb, calls } = fakePb({ sourceItems: [] });
    calls.send.mockRejectedValue({ status: 400 });

    await expect(applyDuplicate(pb, plan())).rejects.toEqual({ status: 400 });
  });

  it("counts the prospectus create in the batch size only when needed", () => {
    expect(batchSize(plan())).toBe(2);
    expect(
      batchSize(
        plan({ target: { id: "t" } as unknown as DuplicatePlan["target"] }),
      ),
    ).toBe(1);
  });
});

describe("toProspectusDuplicateResponse", () => {
  it("exposes only safe fields", async () => {
    const { pb } = fakePb({
      target: { id: "targettargettar", published: false },
      sourceItems: [
        item("cs101", "First Year", "First Semester"),
        item("cs102", "First Year", "Summer"),
      ],
      targetItems: [{ course: "cs102" }],
    });

    const response = toProspectusDuplicateResponse(
      await planDuplicate(pb, input),
    );

    expect(response).toEqual({
      source: {
        id: source.id,
        program: { id: input.program, name: "BS Computer Science", code: "BSCS" },
        school_year: { id: input.source_school_year, label: "2026-2027" },
      },
      target_school_year: targetYear,
      target: { id: "targettargettar", published: false },
      copy: [
        {
          course: { id: "cs101", code: "CS101", title: "cs101" },
          year_level: "First Year",
          semester: "First Semester",
        },
      ],
      skip: [
        {
          course: { id: "cs102", code: "CS102", title: "cs102" },
          year_level: "First Year",
          semester: "Summer",
        },
      ],
    });
  });
});

describe("newRecordId", () => {
  it("makes PocketBase-shaped ids", () => {
    const ids = new Set(Array.from({ length: 50 }, newRecordId));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]{15}$/);
  });
});
