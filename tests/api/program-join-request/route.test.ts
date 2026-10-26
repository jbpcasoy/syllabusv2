import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  getOne: vi.fn(),
  create: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseProgramJoinRequestInput: vi.fn(),
  toProgramJoinRequestResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) => ({
    getList: (...args: unknown[]) => mocks.getList(name, ...args),
    getOne: (...args: unknown[]) => mocks.getOne(name, ...args),
    create: mocks.create,
  });
  return {
    createAdminPb: vi.fn(async () => ({ collection, filter: mocks.filter })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/validators/program-join-request", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/lib/validators/program-join-request")
  >()),
  parseProgramJoinRequestInput: mocks.parseProgramJoinRequestInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/program-join-request", () => ({
  JOIN_REQUEST_EXPAND: "user,program,reviewed_by",
  toProgramJoinRequestResponse: mocks.toProgramJoinRequestResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/program-join-request/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";
const PROGRAM_ID = "prg123prg123prg";
const COLLEGE_ID = "col123col123col";
const DEPT_ID = "dep123dep123dep";

const rows = [
  { id: "abc123abc123abc", user: ME, program: PROGRAM_ID, status: "pending" },
];
const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: rows,
};
const base = { sort: "-created", expand: "user,program,reviewed_by" };
const data = { program: PROGRAM_ID, note: "I teach GE 101" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/program-join-request${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/program-join-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

/** Returns the filter string passed to the main list query. */
function listFilter(): string | undefined {
  const call = mocks.getList.mock.calls.find(
    ([name]) => name === "program_join_requests",
  );
  return (call?.[3] as { filter?: string } | undefined)?.filter;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME, isAdmin: true });
});

describe("GET /api/program-join-request", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toProgramJoinRequestResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.getList).toHaveBeenCalledWith(
      "program_join_requests",
      1,
      30,
      base,
    );
  });

  it("requires sign-in but no specific capability", async () => {
    await GET(get());
    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await GET(get());

    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-5&perPage=9999"));
    expect(mocks.getList).toHaveBeenCalledWith(
      "program_join_requests",
      1,
      100,
      base,
    );
  });

  it("binds search, program, status and user filters", async () => {
    await GET(
      get(`?search=%20ali%20&program=${PROGRAM_ID}&status=pending&user=me`),
    );

    expect(mocks.filter).toHaveBeenCalledWith(
      expect.stringContaining("user.name ~ {:search}"),
      { search: "ali" },
    );
    expect(mocks.filter).toHaveBeenCalledWith("program = {:program}", {
      program: PROGRAM_ID,
    });
    expect(mocks.filter).toHaveBeenCalledWith("status = {:status}", {
      status: "pending",
    });
    expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
      userId: ME,
    });
  });

  it("ignores an unknown status", async () => {
    await GET(get("?status=maybe"));
    expect(mocks.filter).not.toHaveBeenCalledWith(
      "status = {:status}",
      expect.anything(),
    );
  });

  it("does not scope an admin", async () => {
    await GET(get());
    expect(listFilter()).toBeUndefined();
  });

  it("limits an unassigned user to their own requests", async () => {
    mockAuth({ id: ME });

    await GET(get());

    expect(listFilter()).toBe(`(user = {:self}|${JSON.stringify({ self: ME })})`);
  });

  it("lets a chair see their program's requests", async () => {
    mockAuth({ id: ME, roles: { chairOfPrograms: [PROGRAM_ID] } });

    await GET(get());

    expect(listFilter()).toContain(
      `program = {:p0}|${JSON.stringify({ p0: PROGRAM_ID })}`,
    );
  });

  it("lets deans and department heads see their scope", async () => {
    mockAuth({
      id: ME,
      roles: { deanOfColleges: [COLLEGE_ID], headOfDepartments: [DEPT_ID] },
    });

    await GET(get());

    expect(listFilter()).toContain("program.department.college = {:c0}");
    expect(listFilter()).toContain("program.department = {:d0}");
  });

  it("delegates errors to handlePbError", async () => {
    mocks.getList.mockRejectedValue({ status: 500 });

    expect((await GET(get())).status).toBe(500);
  });
});

describe("POST /api/program-join-request", () => {
  beforeEach(() => {
    mockAuth({ id: ME });
    mocks.parseProgramJoinRequestInput.mockReturnValue({ ok: true, data });
    mocks.getOne.mockResolvedValue({ id: PROGRAM_ID });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates a pending request for the caller and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data, user: ME };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post({ ...data, user: "someoneelse1234" }));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(mocks.create).toHaveBeenCalledWith(
      { user: ME, program: PROGRAM_ID, note: data.note, status: "pending" },
      { expand: "user,program,reviewed_by" },
    );
  });

  it("needs only sign-in, so unassigned users can ask", async () => {
    mocks.create.mockResolvedValue({});

    await POST(post(data));

    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("propagates a 404 for an unknown program", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });

    const res = await POST(post(data));

    expect(res.status).toBe(404);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 when the caller is already active faculty of the program", async () => {
    mocks.getList.mockImplementation(async (name: string) => ({
      items: name === "faculties" ? [{ id: "f" }] : [],
    }));

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("already faculty");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 when a pending request already exists", async () => {
    mocks.getList.mockImplementation(async (name: string) => ({
      items: name === "program_join_requests" ? [{ id: "r" }] : [],
    }));

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("pending request");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("checks membership and pending requests with bound filters", async () => {
    mocks.create.mockResolvedValue({});

    await POST(post(data));

    expect(mocks.filter).toHaveBeenCalledWith(
      "user = {:user} && program = {:program} && active = true",
      { user: ME, program: PROGRAM_ID },
    );
    expect(mocks.filter).toHaveBeenCalledWith(
      "user = {:user} && program = {:program} && status = 'pending'",
      { user: ME, program: PROGRAM_ID },
    );
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseProgramJoinRequestInput.mockReturnValue({
      ok: false,
      error: "`program` must be a valid program id",
    });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "`program` must be a valid program id",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseProgramJoinRequestInput.mockReturnValue({
      ok: false,
      error: "invalid",
    });

    const res = await POST(post("{not json", true));

    expect(mocks.parseProgramJoinRequestInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates a create failure (e.g. unique-index race) to handlePbError", async () => {
    mocks.create.mockRejectedValue({ status: 400 });

    expect((await POST(post(data))).status).toBe(400);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseProgramJoinRequestInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
