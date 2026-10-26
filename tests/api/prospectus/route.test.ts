import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  collectionSpy: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseProspectusInput: vi.fn(),
  toProspectusResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) => {
    mocks.collectionSpy(name);
    return { getList: mocks.getList, create: mocks.create };
  };
  return {
    createAdminPb: vi.fn(async () => ({ collection, filter: mocks.filter })),
    handlePbError: vi.fn((error: unknown) =>
      NextResponse.json(
        { error: error instanceof Error ? error.message : "unknown" },
        { status: 500 },
      ),
    ),
  };
});

vi.mock("@/lib/validators/prospectus", () => ({
  parseProspectusInput: mocks.parseProspectusInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/prospectus", () => ({
  PROSPECTUS_EXPAND: "program,school_year",
  toProspectusResponse: mocks.toProspectusResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);

import { GET, POST } from "@/app/api/prospectus/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const PROGRAM_ID = "prog1prog1prog1";

const rows = [
  {
    id: "abc123abc123abc",
    program: PROGRAM_ID,
    school_year: "sy2026sy2026sy2",
    published: true,
  },
];

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: rows,
};

const base = { sort: "-school_year.label,-created", expand: "program,school_year" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/prospectus${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/prospectus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function unauthorized() {
  mockAuth({ signedIn: false });
}

/** Signed in as a dean: prospectus writes are admin-only. */
function forbidden() {
  mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/prospectus", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toProspectusResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.toProspectusResponse).toHaveBeenCalledTimes(rows.length);
    expect(mocks.collectionSpy).toHaveBeenCalledWith("prospectuses");
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("requires sign-in but no specific capability", async () => {
    await GET(get());
    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("uses the superuser client because the collection rules are null", async () => {
    await GET(get());
    expect(createAdminPb).toHaveBeenCalledOnce();
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-5&perPage=9999"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, base);
  });

  it("falls back to defaults for non-numeric values", async () => {
    await GET(get("?page=abc&perPage=xyz"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("binds a search filter over school year label, program name and code", async () => {
    await GET(get("?search=%20bscs%20"));

    expect(mocks.filter).toHaveBeenCalledWith(
      "(school_year.label ~ {:search} || program.name ~ {:search} || program.code ~ {:search})",
      { search: "bscs" }, // trimmed
    );
  });

  it("filters by program and school year", async () => {
    await GET(get(`?program=${PROGRAM_ID}&school_year=sy2026sy2026sy2`));

    expect(mocks.filter).toHaveBeenCalledWith("program = {:program}", {
      program: PROGRAM_ID,
    });
    expect(mocks.filter).toHaveBeenCalledWith("school_year = {:schoolYear}", {
      schoolYear: "sy2026sy2026sy2",
    });
  });

  it("lets a manager filter by published true/false", async () => {
    await GET(get("?published=true"));
    expect(mocks.filter).toHaveBeenLastCalledWith("published = {:published}", {
      published: true,
    });

    await GET(get("?published=false"));
    expect(mocks.filter).toHaveBeenLastCalledWith("published = {:published}", {
      published: false,
    });
  });

  it("ignores an invalid published value", async () => {
    await GET(get("?published=maybe"));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&program=&school_year=&published="));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("combines filters with &&", async () => {
    await GET(get(`?search=cs&program=${PROGRAM_ID}&published=true`));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter.split(" && ")).toHaveLength(3);
  });

  it("forces published = true for a non-manager", async () => {
    forbidden(); // not an admin

    await GET(get());

    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      30,
      expect.objectContaining({ filter: "published = true" }),
    );
  });

  it("ignores a non-manager's published=false filter", async () => {
    forbidden(); // not an admin

    await GET(get("?published=false"));

    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      30,
      expect.objectContaining({ filter: "published = true" }),
    );
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await GET(get());

    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("delegates errors to handlePbError", async () => {
    mocks.getList.mockRejectedValue(new Error("boom"));

    const res = await GET(get());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});

describe("POST /api/prospectus", () => {
  const data = {
    program: PROGRAM_ID,
    school_year: "sy2026sy2026sy2",
    published: false,
  };

  beforeEach(() => {
    mocks.parseProspectusInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates a prospectus and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith("prospectus.write");
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.collectionSpy).toHaveBeenCalledWith("prospectuses");
    expect(mocks.create).toHaveBeenCalledWith(data, { expand: "program,school_year" });
    expect(mocks.toProspectusResponse).toHaveBeenCalledWith(created);
  });

  it("looks for an existing record for the same program and school year", async () => {
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(mocks.filter).toHaveBeenCalledWith(
      "program = {:program} && school_year = {:schoolYear}",
      { program: PROGRAM_ID, schoolYear: "sy2026sy2026sy2" },
    );
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ skipTotal: true }),
    );
  });

  it("returns 409 when the program already has a prospectus for that year", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old" }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "That program already has a prospectus for this school year",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseProspectusInput.mockReturnValue({
      ok: false,
      error: "`program` must be a valid program id",
    });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "`program` must be a valid program id",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseProspectusInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await POST(post("{not json", true));

    expect(mocks.parseProspectusInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates PocketBase errors (e.g. unique-index race) to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseProspectusInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseProspectusInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
