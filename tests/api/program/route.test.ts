import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseProgramInput: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({ getList: mocks.getList, create: mocks.create });
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

vi.mock("@/lib/validators/program", () => ({
  parseProgramInput: mocks.parseProgramInput,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/program/route";
import { createAdminPb } from "@/lib/pocketbase";
import {
  authorizeMock,
  mockAuth,
  requireUserMock,
} from "@/tests/helpers/mock-auth";

const DEPT_ID = "deptAdeptAdeptA";
const COLLEGE_ID = "colgAcolgAcolgA";

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: [{ id: "abc123abc123abc", name: "BS Computer Science", code: "BSCS" }],
};

const base = { sort: "name", expand: "department" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/program${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/program", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/program", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list with default pagination, sorting and expand", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(listResult);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("requires sign-in but no specific capability", async () => {
    await GET(get());
    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("respects page and perPage", async () => {
    await GET(get("?page=3&perPage=10"));
    expect(mocks.getList).toHaveBeenCalledWith(3, 10, base);
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-5&perPage=9999"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, base);
  });

  it("falls back to defaults for non-numeric values", async () => {
    await GET(get("?page=abc&perPage=xyz"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("binds a search filter over name and code", async () => {
    await GET(get("?search=%20bscs%20"));

    expect(mocks.filter).toHaveBeenCalledWith(
      "(name ~ {:search} || code ~ {:search})",
      { search: "bscs" },
    );
  });

  it("filters by department", async () => {
    await GET(get(`?department=${DEPT_ID}`));

    expect(mocks.filter).toHaveBeenCalledWith("department = {:department}", {
      department: DEPT_ID,
    });
  });

  it("combines search and department filters with &&", async () => {
    await GET(get(`?search=cs&department=${DEPT_ID}`));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter).toContain(" && ");
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&department="));

    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  describe("scope", () => {
    it("adds no scope filter for admin, VPAA, chairs or unassigned users", async () => {
      for (const options of [
        { isAdmin: true },
        { roles: { isVpaa: true } },
        { roles: { chairOfPrograms: ["p"] } },
        {},
      ]) {
        mockAuth(options);
        await GET(get());
      }
      expect(mocks.filter).not.toHaveBeenCalled();
    });

    it("limits a dean to programs of their college", async () => {
      mockAuth({ roles: { deanOfColleges: [COLLEGE_ID] } });

      await GET(get());

      expect(mocks.filter).toHaveBeenCalledWith("department.college = {:c0}", {
        c0: COLLEGE_ID,
      });
    });

    it("limits a department head to programs of their department", async () => {
      mockAuth({ roles: { headOfDepartments: [DEPT_ID] } });

      await GET(get());

      expect(mocks.filter).toHaveBeenCalledWith("department = {:d0}", {
        d0: DEPT_ID,
      });
    });

    it("combines the scope with the other filters using &&", async () => {
      mockAuth({ roles: { deanOfColleges: [COLLEGE_ID] } });

      await GET(get("?search=cs"));

      const options = mocks.getList.mock.calls[0][2] as { filter: string };
      expect(options.filter.split(" && ")).toHaveLength(2);
    });
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

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

describe("POST /api/program", () => {
  const data = {
    name: "BS Computer Science",
    code: "BSCS",
    department: DEPT_ID,
  };

  beforeEach(() => {
    mocks.parseProgramInput.mockReturnValue({ ok: true, data });
  });

  it("creates a program and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
    expect(mocks.create).toHaveBeenCalledWith(data, { expand: "department" });
  });

  it("authorizes program.create against the department in the body", async () => {
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(authorizeMock).toHaveBeenCalledWith(
      expect.anything(),
      "program.create",
      { department: DEPT_ID },
    );
  });

  it("lets a dean create inside their college", async () => {
    mockAuth({
      roles: { deanOfColleges: [COLLEGE_ID] },
      scope: { collegeId: COLLEGE_ID, departmentId: DEPT_ID },
    });
    mocks.create.mockResolvedValue({ id: "x" });

    expect((await POST(post(data))).status).toBe(201);
  });

  it("returns 403 for a dean outside their college and creates nothing", async () => {
    mockAuth({
      roles: { deanOfColleges: ["colgBcolgBcolgB"] },
      scope: { collegeId: COLLEGE_ID, departmentId: DEPT_ID },
    });

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 403 for a department head (cannot create)", async () => {
    mockAuth({
      roles: { headOfDepartments: [DEPT_ID] },
      scope: { collegeId: COLLEGE_ID, departmentId: DEPT_ID },
    });

    expect((await POST(post(data))).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseProgramInput.mockReturnValue({
      ok: false,
      error: "`code` is required",
    });

    const res = await POST(post({ name: "BS Computer Science" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "`code` is required" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseProgramInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await POST(post("{not json", true));

    expect(mocks.parseProgramInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseProgramInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 for a user with no roles and creates nothing", async () => {
    mockAuth();

    expect((await POST(post(data))).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
