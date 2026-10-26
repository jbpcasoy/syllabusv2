import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  findLiveReference,
  hasLiveReferenceTo,
  listReferenceSources,
  referenceTransition,
  toSyllabusReferenceResponse,
  type ReferenceActor,
} from "@/lib/syllabus-reference";
import type {
  ReferenceAction,
  ReferenceStatus,
  SyllabusReference,
} from "@/types/syllabus-reference";
import type PocketBase from "pocketbase";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

function fakePb(handlers: Record<string, Record<string, unknown>>) {
  return {
    filter,
    collection: (name: string) => {
      const h = handlers[name];
      if (!h) throw new Error(`unexpected collection ${name}`);
      return h;
    },
  } as unknown as PocketBase;
}

describe("toSyllabusReferenceResponse", () => {
  it("maps relations to safe shapes", () => {
    const response = toSyllabusReferenceResponse({
      id: "refrefrefrefref",
      syllabus: "sylsylsylsylsyl",
      program: "prgBprgBprgBprg",
      course: "crscrscrscrscrs",
      term: "trmtrmtrmtrmtrm",
      requested_by: "chrchrchrchrchr",
      note: "",
      status: "pending",
      reason: "",
      decided_by: "",
      decided_at: "",
      ended_by: "",
      ended_at: "",
      created: "c",
      updated: "u",
      expand: {
        syllabus: {
          id: "sylsylsylsylsyl",
          status: "draft",
          lead: "leadleadleadlea",
          expand: {
            program: { id: "prgAprgAprgAprg", name: "Nursing", code: "NURS" },
            lead: { id: "leadleadleadlea", name: "Ana", email: "secret@x" },
          },
        },
        program: { id: "prgBprgBprgBprg", name: "IT", code: "BSIT" },
        course: { id: "crscrscrscrscrs", code: "GE 1", title: "Math" },
        term: {
          id: "trmtrmtrmtrmtrm",
          semester: "Summer",
          expand: { school_year: { label: "2026-2027" } },
        },
        requested_by: { id: "chrchrchrchrchr", name: "Cy", email: "secret@x" },
      },
    } as unknown as SyllabusReference);

    expect(response.expand).toEqual({
      syllabus: {
        id: "sylsylsylsylsyl",
        status: "draft",
        lead: "leadleadleadlea",
        program: { id: "prgAprgAprgAprg", name: "Nursing", code: "NURS" },
        lead_name: "Ana",
      },
      program: { id: "prgBprgBprgBprg", name: "IT", code: "BSIT" },
      course: { id: "crscrscrscrscrs", code: "GE 1", title: "Math" },
      term: {
        id: "trmtrmtrmtrmtrm",
        semester: "Summer",
        school_year_label: "2026-2027",
      },
      requested_by: { id: "chrchrchrchrchr", name: "Cy" },
    });
    expect(JSON.stringify(response)).not.toContain("secret");
  });
});

describe("findLiveReference", () => {
  it("finds a pending or approved reference for the slot", async () => {
    const live = { id: "refrefrefrefref", status: "approved" };
    const getList = vi.fn(async () => ({ items: [live] }));
    const pb = fakePb({ syllabus_references: { getList } });

    expect(
      await findLiveReference(pb, { program: "p", course: "c", term: "t" }),
    ).toBe(live);
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      expand: "syllabus.program",
      filter:
        'program = "p" && course = "c" && term = "t" && (status = \'pending\' || status = \'approved\')',
    });
  });

  it("returns null when the slot is free", async () => {
    const pb = fakePb({
      syllabus_references: { getList: vi.fn(async () => ({ items: [] })) },
    });
    expect(
      await findLiveReference(pb, { program: "p", course: "c", term: "t" }),
    ).toBeNull();
  });
});

describe("hasLiveReferenceTo", () => {
  it.each([
    [[{ id: "x" }], true],
    [[], false],
  ])("checks live references to the syllabus", async (items, expected) => {
    const getList = vi.fn(async () => ({ items }));
    const pb = fakePb({ syllabus_references: { getList } });

    expect(await hasLiveReferenceTo(pb, "sylsylsylsylsyl")).toBe(expected);
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      fields: "id",
      filter:
        'syllabus = "sylsylsylsylsyl" && (status = \'pending\' || status = \'approved\')',
    });
  });
});

describe("listReferenceSources", () => {
  const term = {
    id: "trmtrmtrmtrmtrm",
    school_year: "sy0sy0sy0sy0sy0",
    semester: "Summer" as const,
  };
  const query = { program: "prgBprgBprgBprg", term, page: 1, perPage: 30 };

  it("returns nothing when the program lists no courses for the term", async () => {
    const syllabiGetList = vi.fn();
    const pb = fakePb({
      prospectus_items: { getFullList: vi.fn(async () => []) },
      syllabi: { getList: syllabiGetList },
    });

    expect((await listReferenceSources(pb, query)).items).toEqual([]);
    expect(syllabiGetList).not.toHaveBeenCalled();
  });

  it("lists other programs' syllabi for the listed courses", async () => {
    const itemsGetFullList = vi.fn(async () => [
      { course: "crsAcrsAcrsAcrs" },
      { course: "crsAcrsAcrsAcrs" },
    ]);
    const syllabiGetList = vi.fn(async () => ({
      page: 1,
      perPage: 30,
      totalItems: 1,
      totalPages: 1,
      items: [
        {
          id: "sylsylsylsylsyl",
          status: "submitted",
          submitted_at: "2026-10-01",
          expand: {
            course: { id: "crsAcrsAcrsAcrs", code: "GE 1", title: "Math" },
            program: { id: "prgAprgAprgAprg", name: "Nursing", code: "NURS" },
            lead: { name: "Ana", email: "secret@x" },
          },
        },
      ],
    }));
    const pb = fakePb({
      prospectus_items: { getFullList: itemsGetFullList },
      syllabi: { getList: syllabiGetList },
    });

    const result = await listReferenceSources(pb, { ...query, search: "GE" });

    expect(itemsGetFullList).toHaveBeenCalledWith({
      fields: "course",
      filter:
        'semester = "Summer" && prospectus.program = "prgBprgBprgBprg" && prospectus.school_year = "sy0sy0sy0sy0sy0" && prospectus.published = true',
    });
    expect(syllabiGetList).toHaveBeenCalledWith(1, 30, {
      expand: "course,program,lead",
      sort: "course.code,program.code",
      filter:
        'term = "trmtrmtrmtrmtrm" && program != "prgBprgBprgBprg" && (course = "crsAcrsAcrsAcrs") && (course.code ~ "GE" || course.title ~ "GE" || program.code ~ "GE")',
    });
    expect(result.items).toEqual([
      {
        id: "sylsylsylsylsyl",
        status: "submitted",
        submitted_at: "2026-10-01",
        course: { id: "crsAcrsAcrsAcrs", code: "GE 1", title: "Math" },
        program: { id: "prgAprgAprgAprg", name: "Nursing", code: "NURS" },
        lead_name: "Ana",
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});

const actor = (partial: Partial<ReferenceActor>): ReferenceActor => ({
  isSourceLead: false,
  canRequest: false,
  isAdmin: false,
  ...partial,
});
const lead = actor({ isSourceLead: true });
const chair = actor({ canRequest: true });
const both = actor({ isSourceLead: true, canRequest: true });
const nobody = actor({});
// Capabilities always pass for admin, so an admin can also request/withdraw.
const admin = actor({ isAdmin: true, canRequest: true });

describe("referenceTransition", () => {
  it.each<[ReferenceAction, ReferenceStatus, ReferenceStatus, "decided" | "ended"]>([
    ["approve", "pending", "approved", "decided"],
    ["reject", "pending", "rejected", "decided"],
    ["revoke", "approved", "revoked", "ended"],
  ])("lets the source lead %s a %s reference", (action, from, to, stamp) => {
    expect(referenceTransition(from, action, lead)).toEqual({
      ok: true,
      next: to,
      stamp,
    });
  });

  it.each<ReferenceStatus>(["pending", "approved"])(
    "lets the referencing chair withdraw a %s reference",
    (from) => {
      expect(referenceTransition(from, "withdraw", chair)).toEqual({
        ok: true,
        next: "withdrawn",
        stamp: "ended",
      });
    },
  );

  it("lets a chair who leads the source approve their own request", () => {
    expect(referenceTransition("pending", "approve", both)).toMatchObject({
      ok: true,
      next: "approved",
    });
  });

  it.each<[ReferenceAction, ReferenceStatus, ReferenceStatus]>([
    ["approve", "pending", "approved"],
    ["reject", "pending", "rejected"],
    ["revoke", "approved", "revoked"],
    ["withdraw", "approved", "withdrawn"],
  ])("lets an admin %s a %s reference", (action, from, to) => {
    expect(referenceTransition(from, action, admin)).toMatchObject({
      ok: true,
      next: to,
    });
  });

  it("still applies status rules to an admin", () => {
    expect(referenceTransition("rejected", "approve", admin)).toMatchObject({
      ok: false,
      status: 409,
    });
  });

  it.each<ReferenceAction>(["approve", "reject", "revoke"])(
    "refuses %s from someone who isn't the source lead",
    (action) => {
      expect(referenceTransition("pending", action, chair)).toEqual({
        ok: false,
        status: 403,
        error: "Only the lead of the referenced syllabus can do this.",
      });
    },
  );

  it("refuses withdraw from someone who isn't the referencing chair", () => {
    expect(referenceTransition("pending", "withdraw", lead)).toEqual({
      ok: false,
      status: 403,
      error: "Only the referencing program's chair can withdraw it.",
    });
  });

  it("checks permission before status, so outsiders learn nothing", () => {
    expect(referenceTransition("rejected", "approve", nobody)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it.each<[ReferenceAction, ReferenceStatus]>([
    ["approve", "approved"],
    ["approve", "rejected"],
    ["reject", "withdrawn"],
    ["revoke", "pending"],
    ["revoke", "revoked"],
    ["withdraw", "rejected"],
    ["withdraw", "withdrawn"],
    ["withdraw", "revoked"],
  ])("refuses %s on a %s reference with 409", (action, from) => {
    const result = referenceTransition(from, action, both);
    expect(result).toEqual({
      ok: false,
      status: 409,
      error: `This reference is already ${from}.`,
    });
  });
});
