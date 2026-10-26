import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  parseProspectusDuplicateInput: vi.fn(),
  planDuplicate: vi.fn(),
  applyDuplicate: vi.fn(),
  batchSize: vi.fn(),
  toProspectusDuplicateResponse: vi.fn(() => ({ preview: true })),
  toProspectusResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

const pb = vi.hoisted(() => ({
  collection: () => ({ getOne: mocks.getOne }),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => pb),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/validators/prospectus-duplicate", () => ({
  parseProspectusDuplicateInput: mocks.parseProspectusDuplicateInput,
}));

// Mocked wholesale so the real modules (and "server-only") are never loaded.
vi.mock("@/lib/prospectus-duplicate", () => ({
  MAX_BATCH_REQUESTS: 500,
  applyDuplicate: mocks.applyDuplicate,
  batchSize: mocks.batchSize,
  planDuplicate: mocks.planDuplicate,
  toProspectusDuplicateResponse: mocks.toProspectusDuplicateResponse,
}));
vi.mock("@/lib/prospectus", () => ({
  PROSPECTUS_EXPAND: "program,school_year",
  toProspectusResponse: mocks.toProspectusResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET, POST } from "@/app/api/prospectus/duplicate/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const input = {
  program: "prog1prog1prog1",
  source_school_year: "sy2026sy2026sy2",
  target_school_year: "sy2027sy2027sy2",
};
const TARGET_ID = "targettargettar";

function get(query: string) {
  return new NextRequest(`http://localhost/api/prospectus/duplicate${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/prospectus/duplicate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function plan(overrides: Record<string, unknown> = {}) {
  return {
    input,
    targetSchoolYear: { id: input.target_school_year, label: "2027-2028" },
    target: null,
    copy: [{ id: "a" }, { id: "b" }],
    skip: [],
    ...overrides,
  };
}

/** Signed in as a dean: duplicating is admin-only. */
function forbidden() {
  mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
  mocks.parseProspectusDuplicateInput.mockReturnValue({
    ok: true,
    data: input,
  });
  mocks.planDuplicate.mockResolvedValue(plan());
  mocks.batchSize.mockReturnValue(3);
});

describe("GET /api/prospectus/duplicate (preview)", () => {
  const query = `?program=${input.program}&source_school_year=${input.source_school_year}&target_school_year=${input.target_school_year}`;

  it("returns the plan without writing anything", async () => {
    const res = await GET(get(query));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ preview: true });
    expect(requireUserMock).toHaveBeenCalledWith("prospectus.write");
    expect(mocks.parseProspectusDuplicateInput).toHaveBeenCalledWith(input);
    expect(mocks.planDuplicate).toHaveBeenCalledWith(pb, input);
    expect(mocks.applyDuplicate).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseProspectusDuplicateInput.mockReturnValue({
      ok: false,
      error: "Choose a target school year different from the source",
    });

    const res = await GET(get("?program=x"));

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates a 404 when the source prospectus doesn't exist", async () => {
    mocks.planDuplicate.mockRejectedValue({ status: 404 });

    const res = await GET(get(query));

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await GET(get(query));

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin and never touches PocketBase", async () => {
    forbidden();

    const res = await GET(get(query));

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("POST /api/prospectus/duplicate", () => {
  beforeEach(() => {
    mocks.applyDuplicate.mockResolvedValue(TARGET_ID);
    mocks.getOne.mockResolvedValue({ id: TARGET_ID });
  });

  it("creates the target prospectus and returns 201", async () => {
    const res = await POST(post(input));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      prospectus: { id: TARGET_ID, mapped: true },
      preview: true,
    });
    expect(mocks.planDuplicate).toHaveBeenCalledWith(pb, input);
    expect(mocks.applyDuplicate).toHaveBeenCalledWith(pb, plan());
    expect(mocks.getOne).toHaveBeenCalledWith(TARGET_ID, {
      expand: "program,school_year",
    });
  });

  it("returns 200 when items are added to an existing prospectus", async () => {
    mocks.planDuplicate.mockResolvedValue(
      plan({ target: { id: TARGET_ID, published: true } }),
    );

    const res = await POST(post(input));

    expect(res.status).toBe(200);
    expect(mocks.applyDuplicate).toHaveBeenCalled();
  });

  it("returns 409 when the existing target already has every course", async () => {
    mocks.planDuplicate.mockResolvedValue(
      plan({ target: { id: TARGET_ID }, copy: [], skip: [{ id: "a" }] }),
    );

    const res = await POST(post(input));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error:
        "Nothing to copy: the 2027-2028 prospectus already lists every course",
    });
    expect(mocks.applyDuplicate).not.toHaveBeenCalled();
  });

  it("still creates an empty target prospectus when the source has no items", async () => {
    mocks.planDuplicate.mockResolvedValue(plan({ copy: [] }));
    mocks.batchSize.mockReturnValue(1);

    const res = await POST(post(input));

    expect(res.status).toBe(201);
  });

  it("returns 400 when the batch would exceed the server limit", async () => {
    mocks.batchSize.mockReturnValue(501);

    const res = await POST(post(input));

    expect(res.status).toBe(400);
    expect(mocks.applyDuplicate).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseProspectusDuplicateInput.mockReturnValue({
      ok: false,
      error: "bad",
    });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseProspectusDuplicateInput.mockReturnValue({
      ok: false,
      error: "bad",
    });

    await POST(post("{not json", true));

    expect(mocks.parseProspectusDuplicateInput).toHaveBeenCalledWith(null);
  });

  it("propagates a 404 when the source or target year is missing", async () => {
    mocks.planDuplicate.mockRejectedValue({ status: 404 });

    const res = await POST(post(input));

    expect(res.status).toBe(404);
  });

  it("delegates a failed batch (e.g. a unique-index race) to handlePbError", async () => {
    mocks.applyDuplicate.mockRejectedValue({ status: 400 });

    const res = await POST(post(input));

    expect(res.status).toBe(400);
    expect(mocks.getOne).not.toHaveBeenCalled();
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await POST(post(input));

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(input));

    expect(res.status).toBe(403);
    expect(mocks.parseProspectusDuplicateInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
