import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const previous = vi.hoisted(() => ({ findPreviousSyllabus: vi.fn() }));
vi.mock("@/lib/syllabus-previous", () => previous);

import {
  activeHolderName,
  canViewJustification,
  ensureBasedOn,
  loadJustificationResponse,
  userNames,
} from "@/lib/justification";
import type { Syllabus } from "@/types/syllabus";
import type PocketBase from "pocketbase";

const ID = "sylsylsylsylsyl";
const OLD = "oldoldoldoldold";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

type Handlers = Record<string, Record<string, ReturnType<typeof vi.fn>>>;
const fakePb = (handlers: Handlers) =>
  ({ filter, collection: (name: string) => handlers[name] }) as unknown as PocketBase;

const syllabus = (extra: Partial<Syllabus> = {}) =>
  ({
    id: ID,
    course: "crs",
    program: "prg",
    term: "trm",
    lead: "dee",
    co_authors: ["cy"],
    status: "approved",
    based_on: OLD,
    ...extra,
  }) as Syllabus;

describe("canViewJustification", () => {
  it.each([
    ["lead", true],
    ["coAuthor", true],
    ["reviewer", true],
    ["admin", true],
    ["referencer", false],
    ["chair", false],
    [null, false],
  ] as const)("%s → %s", (access, expected) => {
    expect(canViewJustification(access)).toBe(expected);
  });
});

describe("ensureBasedOn", () => {
  it("keeps an existing link without querying", async () => {
    const pb = fakePb({});
    expect(await ensureBasedOn(pb, syllabus())).toBe(OLD);
    expect(previous.findPreviousSyllabus).not.toHaveBeenCalled();
  });

  it("looks the previous syllabus up and saves it", async () => {
    const update = vi.fn();
    const pb = fakePb({
      terms: {
        getOne: vi.fn(async () => ({
          semester: "First Semester",
          expand: { school_year: { label: "2026-2027" } },
        })),
      },
      syllabi: { update },
    });
    previous.findPreviousSyllabus.mockResolvedValue({ id: OLD });

    expect(await ensureBasedOn(pb, syllabus({ based_on: "" }))).toBe(OLD);
    expect(previous.findPreviousSyllabus).toHaveBeenCalledWith(pb, {
      course: "crs",
      program: "prg",
      semester: "First Semester",
      schoolYearLabel: "2026-2027",
    });
    expect(update).toHaveBeenCalledWith(ID, { based_on: OLD });
  });

  it("returns '' and saves nothing when there is none", async () => {
    const update = vi.fn();
    const pb = fakePb({
      terms: { getOne: vi.fn(async () => ({ semester: "Summer" })) },
      syllabi: { update },
    });
    previous.findPreviousSyllabus.mockResolvedValue(null);

    expect(await ensureBasedOn(pb, syllabus({ based_on: "" }))).toBe("");
    expect(update).not.toHaveBeenCalled();
  });
});

describe("userNames", () => {
  it("skips the query for no ids", async () => {
    const getFullList = vi.fn();
    expect(await userNames(fakePb({ users: { getFullList } }), ["", ""])).toEqual(new Map());
    expect(getFullList).not.toHaveBeenCalled();
  });

  it("maps ids to names", async () => {
    const getFullList = vi.fn(async () => [{ id: "ana", name: "Ana" }]);
    const names = await userNames(fakePb({ users: { getFullList } }), ["ana", "ana"]);
    expect(names.get("ana")).toBe("Ana");
    expect(getFullList).toHaveBeenCalledWith({ fields: "id,name", filter: '(id = "ana")' });
  });
});

describe("activeHolderName", () => {
  it("reads the active CITL director", async () => {
    const getList = vi.fn(async () => ({ items: [{ expand: { user: { name: "Dr. C" } } }] }));
    expect(await activeHolderName(fakePb({ citl_directors: { getList } }), "citl_directors")).toBe("Dr. C");
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      expand: "user",
      filter: "active = true",
    });
  });

  it("scopes the program chair and answers '' when none", async () => {
    const getList = vi.fn(async () => ({ items: [] }));
    expect(
      await activeHolderName(fakePb({ program_chairs: { getList } }), "program_chairs", "prg"),
    ).toBe("");
    expect(getList).toHaveBeenCalledWith(1, 1, expect.objectContaining({
      filter: 'active = true && program = "prg"',
    }));
  });
});

describe("loadJustificationResponse", () => {
  function pbWith(record: unknown) {
    return fakePb({
      syllabi: {
        getOne: vi.fn(async () => ({ lead: "ana", co_authors: ["ben", "cy"] })),
      },
      syllabus_justifications: {
        getList: vi.fn(async () => ({ items: record ? [record] : [] })),
      },
      users: {
        getFullList: vi.fn(async () => [
          { id: "ana", name: "Ana" },
          { id: "ben", name: "Ben" },
        ]),
      },
    });
  }

  it("lists previous authors who aren't current authors", async () => {
    const response = await loadJustificationResponse(pbWith(null), syllabus(), {
      access: "lead",
      canReturn: false,
    });
    expect(response).toEqual({
      applies: true,
      eligible_authors: [
        { id: "ana", name: "Ana" },
        { id: "ben", name: "Ben" },
      ],
      justification: null,
      can_edit: true,
      can_return: false,
    });
  });

  it("maps the record without its file name", async () => {
    const response = await loadJustificationResponse(
      pbWith({
        id: "jst",
        status: "submitted",
        entries: [{ author: "ana", reason: "On leave." }],
        scan: "letter_abc.pdf",
        submitted_at: "2026-10-27",
        return_reason: "",
        returned_by: "",
        returned_at: "",
        updated: "2026-10-27",
      }),
      syllabus(),
      { access: "reviewer", canReturn: true },
    );
    expect(response.justification).toEqual({
      id: "jst",
      status: "submitted",
      entries: [{ author: { id: "ana", name: "Ana" }, reason: "On leave." }],
      has_scan: true,
      submitted_at: "2026-10-27",
      return_reason: "",
      returned_by: null,
      returned_at: "",
      updated: "2026-10-27",
    });
    expect(JSON.stringify(response)).not.toContain("letter_abc");
    expect(response.can_edit).toBe(false);
    expect(response.can_return).toBe(true);
  });

  it("locks editing while submitted and before approval", async () => {
    const submitted = await loadJustificationResponse(
      pbWith({ id: "j", status: "submitted", entries: [] }),
      syllabus(),
      { access: "lead", canReturn: false },
    );
    expect(submitted.can_edit).toBe(false);

    const inReview = await loadJustificationResponse(pbWith(null), syllabus({ status: "submitted" }), {
      access: "lead",
      canReturn: false,
    });
    expect(inReview.can_edit).toBe(false);
  });

  it("doesn't apply without a previous syllabus", async () => {
    previous.findPreviousSyllabus.mockResolvedValue(null);
    const pb = fakePb({
      terms: { getOne: vi.fn(async () => ({ semester: "Summer" })) },
      syllabus_justifications: { getList: vi.fn(async () => ({ items: [] })) },
    });
    const response = await loadJustificationResponse(pb, syllabus({ based_on: "" }), {
      access: "lead",
      canReturn: false,
    });
    expect(response).toMatchObject({ applies: false, eligible_authors: [], can_edit: false });
  });
});
