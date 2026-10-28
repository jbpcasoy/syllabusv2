import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  versionsList: vi.fn(),
  eventsList: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collections: Record<string, unknown> = {
    syllabi: { getOne: mocks.syllabiGetOne },
    syllabus_versions: { getFullList: mocks.versionsList },
    syllabus_events: { getFullList: mocks.eventsList },
  };
  return {
    createAdminPb: vi.fn(async () => ({
      filter: (expr: string, params: Record<string, unknown>) =>
        expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key])),
      collection: (name: string) => collections[name],
    })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/syllabus", () => ({
  resolveSyllabusAccess: mocks.resolveSyllabusAccess,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

// buildTimeline stays real: it is pure.
import { GET } from "@/app/api/syllabus/[id]/timeline/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const ME = "me1me1me1me1me1";
const ctx = { params: Promise.resolve({ id: ID }) };
const syllabus = {
  id: ID,
  lead: "leadleadleadlea",
  co_authors: [],
  status: "submitted",
  program: "prg",
  created: "2026-01-01 08:00:00.000Z",
};

const get = () =>
  GET(new NextRequest(`http://localhost/api/syllabus/${ID}/timeline`), ctx);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME });
  mocks.syllabiGetOne.mockResolvedValue(syllabus);
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.versionsList.mockResolvedValue([
    {
      id: "v1",
      version_no: 1,
      created: "2026-01-02 08:00:00.000Z",
      expand: { uploaded_by: { name: "Lea", email: "lea@buksu.edu.ph" } },
    },
  ]);
  mocks.eventsList.mockResolvedValue([
    {
      type: "submitted",
      created: "2026-01-03 08:00:00.000Z",
      stage: 1,
      version: "v1",
      approval_code: "",
      reason: "",
      expand: { actor: { name: "Lea", email: "lea@buksu.edu.ph" } },
    },
  ]);
});

describe("GET /api/syllabus/:id/timeline", () => {
  it("returns the timeline oldest first", async () => {
    const res = await get();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.map((e: { kind: string }) => e.kind)).toEqual([
      "created",
      "uploaded",
      "submitted",
    ]);
    expect(body.items[2]).toEqual({
      kind: "submitted",
      at: "2026-01-03 08:00:00.000Z",
      stage: 1,
      version_no: 1,
      actor_name: "Lea",
      approval_code: "",
      reason: "",
    });
  });

  it("sends names, never emails", async () => {
    const text = await (await get()).text();
    expect(text).not.toContain("@buksu.edu.ph");
  });

  it("asks PocketBase for names only, scoped to the syllabus", async () => {
    await get();
    const filter = `syllabus = "${ID}"`;
    expect(mocks.versionsList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter,
        fields: "id,version_no,created,expand.uploaded_by.name",
      }),
    );
    expect(mocks.eventsList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter,
        fields: "type,created,stage,version,approval_code,reason,expand.actor.name",
      }),
    );
  });

  it("answers 404 without access, before loading anything else", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    const res = await get();
    expect(res.status).toBe(404);
    expect(mocks.eventsList).not.toHaveBeenCalled();
    expect(mocks.versionsList).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    expect((await get()).status).toBe(404);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors", async () => {
    mocks.eventsList.mockRejectedValue({ status: 400 });
    expect((await get()).status).toBe(400);
    expect(handlePbError).toHaveBeenCalled();
  });
});
