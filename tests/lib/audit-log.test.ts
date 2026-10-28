import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  auditDetail,
  auditFilter,
  listAudit,
  toAuditResponse,
} from "@/lib/audit-log";
import type { AuditEntry } from "@/types/audit";
import type PocketBase from "pocketbase";

const SYL = "sylsylsylsylsyl";
const OTHER = "othothothothoth";
const ADMIN = "admin1111111111";
const OLD = "oldleadoldleado";
const NEW = "newleadnewleadn";

const auditGetList = vi.fn();
const syllabiGetFullList = vi.fn();
const usersGetFullList = vi.fn();
const pb = {
  // Mirrors pb.filter() closely enough to see the params are bound.
  filter: vi.fn((expr: string, params: Record<string, unknown>) =>
    expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key])),
  ),
  collection: vi.fn((name: string) =>
    name === "audit_log"
      ? { getList: auditGetList }
      : name === "users"
        ? { getFullList: usersGetFullList }
        : { getFullList: syllabiGetFullList },
  ),
} as unknown as PocketBase;

const row = (extra: Partial<AuditEntry> = {}) =>
  ({
    id: "aud111111111111",
    actor: ADMIN,
    action: "lead.transferred",
    target_collection: "syllabi",
    target_id: SYL,
    syllabus: SYL,
    override: true,
    reason: "The chair is on leave.",
    data: { from_lead: OLD, to_lead: NEW, keep_previous: true },
    created: "2026-10-28 08:00:00.000Z",
    expand: { actor: { name: "Ada Admin", email: "ada@buksu.edu.ph" } },
    ...extra,
  }) as unknown as AuditEntry;

const USERS = new Map([
  [OLD, "Ana Cruz"],
  [NEW, "Ben Reyes"],
]);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auditFilter", () => {
  it("is empty with no filters", () => {
    expect(auditFilter(pb, {})).toBe("");
  });

  it("binds every filter through pb.filter", () => {
    const from = new Date("2026-09-30T16:00:00.000Z");
    const to = new Date("2026-10-28T16:00:00.000Z");
    expect(
      auditFilter(pb, {
        action: "approved",
        actor: ADMIN,
        syllabus: SYL,
        override: false,
        from,
        to,
      }),
    ).toBe(
      [
        'action = "approved"',
        `actor = "${ADMIN}"`,
        `syllabus = "${SYL}"`,
        "override = false",
        `created >= ${JSON.stringify(from)}`,
        `created < ${JSON.stringify(to)}`,
      ].join(" && "),
    );
    expect(pb.filter).toHaveBeenCalledTimes(6);
  });
});

describe("auditDetail", () => {
  it.each([
    [
      "submitted",
      { from: { status: "draft", stage: 0 }, to: { status: "submitted", stage: 1 } },
      "Draft → In review (Program Reviewer)",
    ],
    [
      "approved",
      {
        from: { status: "submitted", stage: 2 },
        to: { status: "submitted", stage: 3 },
        approval_code: "SYL-2627-1-0042-S2",
      },
      "In review (Dean) → In review (FDIS Chair) · SYL-2627-1-0042-S2",
    ],
    [
      "returned",
      { from: { status: "submitted", stage: 2 }, to: { status: "returned", stage: 2 } },
      "In review (Dean) → Returned (Dean)",
    ],
    [
      "approved",
      { from: { status: "submitted", stage: 5 }, to: { status: "approved", stage: 5 } },
      "In review (VPAA) → Approved",
    ],
    [
      "scan_returned",
      { from: { status: "filed", stage: 5 }, to: { status: "approved", stage: 5 } },
      "Filed → Approved",
    ],
  ] as const)("describes %s", (action, data, expected) => {
    expect(auditDetail({ action, data }, USERS)).toBe(expected);
  });

  it("names both leads", () => {
    expect(auditDetail(row(), USERS)).toBe(
      "From Ana Cruz to Ben Reyes, previous lead kept as co-author",
    );
    expect(
      auditDetail(row({ data: { from_lead: OLD, to_lead: NEW, keep_previous: false } }), USERS),
    ).toBe("From Ana Cruz to Ben Reyes");
  });

  it("copes with a removed user and missing data", () => {
    expect(auditDetail(row(), new Map())).toBe(
      "From a removed user to a removed user, previous lead kept as co-author",
    );
    expect(auditDetail({ action: "filed", data: null }, USERS)).toBe("? → ?");
  });

  it.each([
    ["version", "Syllabus version"],
    ["signed_copy", "Signed copy"],
    ["justification_scan", "Justification scan"],
    ["other", "File"],
  ])("names a %s upload", (kind, expected) => {
    expect(auditDetail({ action: "file.uploaded", data: { kind } }, USERS)).toBe(
      expected,
    );
  });
});

describe("toAuditResponse", () => {
  it("maps the row with the actor's name and never their email", () => {
    const response = toAuditResponse(row(), {
      syllabi: new Map([[SYL, "BSIT · IT 101"]]),
      users: USERS,
    });
    expect(response).toEqual({
      id: "aud111111111111",
      action: "lead.transferred",
      actor_name: "Ada Admin",
      syllabus: SYL,
      syllabus_label: "BSIT · IT 101",
      detail: "From Ana Cruz to Ben Reyes, previous lead kept as co-author",
      override: true,
      reason: "The chair is on leave.",
      data: { from_lead: OLD, to_lead: NEW, keep_previous: true },
      created: "2026-10-28 08:00:00.000Z",
    });
    expect(JSON.stringify(response)).not.toContain("@");
  });

  it("leaves names blank for a system action or a deleted syllabus", () => {
    expect(
      toAuditResponse(row({ actor: "", expand: undefined }), {
        syllabi: new Map(),
        users: new Map(),
      }),
    ).toMatchObject({ actor_name: "", syllabus_label: "" });
  });
});

describe("listAudit", () => {
  it("lists newest first, labelling each syllabus and lead once", async () => {
    auditGetList.mockResolvedValue({
      page: 1,
      perPage: 30,
      totalItems: 3,
      totalPages: 1,
      items: [
        row(),
        row({ id: "aud2", action: "file.uploaded", data: { kind: "version" } }),
        row({ id: "aud3", syllabus: OTHER }),
      ],
    });
    syllabiGetFullList.mockResolvedValue([
      { id: SYL, expand: { course: { code: "IT 101" }, program: { code: "BSIT" } } },
    ]);
    usersGetFullList.mockResolvedValue([
      { id: OLD, name: "Ana Cruz" },
      { id: NEW, name: "Ben Reyes" },
    ]);

    const result = await listAudit(pb, { action: "lead.transferred" }, 1, 30);

    expect(auditGetList).toHaveBeenCalledWith(1, 30, {
      sort: "-created,-id",
      expand: "actor",
      fields:
        "id,action,actor,syllabus,override,reason,data,created,expand.actor.name",
      filter: 'action = "lead.transferred"',
    });
    expect(syllabiGetFullList).toHaveBeenCalledWith({
      expand: "course,program",
      fields: "id,expand.course.code,expand.program.code",
      filter: `id = "${SYL}" || id = "${OTHER}"`,
    });
    expect(usersGetFullList).toHaveBeenCalledWith({
      fields: "id,name",
      filter: `id = "${OLD}" || id = "${NEW}"`,
    });
    expect(result.items.map((i) => [i.syllabus_label, i.detail])).toEqual([
      ["BSIT · IT 101", "From Ana Cruz to Ben Reyes, previous lead kept as co-author"],
      ["BSIT · IT 101", "Syllabus version"],
      ["", "From Ana Cruz to Ben Reyes, previous lead kept as co-author"],
    ]);
    expect(result.totalItems).toBe(3);
  });

  it("skips both lookups when no row needs them", async () => {
    auditGetList.mockResolvedValue({
      page: 1,
      perPage: 30,
      totalItems: 0,
      totalPages: 0,
      items: [],
    });
    await listAudit(pb, {}, 1, 30);
    expect(syllabiGetFullList).not.toHaveBeenCalled();
    expect(usersGetFullList).not.toHaveBeenCalled();
  });
});
