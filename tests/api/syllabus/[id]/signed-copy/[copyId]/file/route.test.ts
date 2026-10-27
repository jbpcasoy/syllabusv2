import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  copiesGetOne: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  fetchVersionFile: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi"
      ? { getOne: mocks.syllabiGetOne }
      : { getOne: mocks.copiesGetOne };
  return {
    createAdminPb: vi.fn(async () => ({ collection })),
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
vi.mock("@/lib/syllabus-version", () => ({
  fetchVersionFile: mocks.fetchVersionFile,
}));
vi.mock("@/lib/signed-copy", () => ({
  signedCopyFileName: (course: string, program: string) =>
    `${course}-${program}-signed.pdf`,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET } from "@/app/api/syllabus/[id]/signed-copy/[copyId]/file/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const COPY = "cpycpycpycpycpy";
const ctx = { params: Promise.resolve({ id: ID, copyId: COPY }) };

const get = () =>
  GET(
    new NextRequest(`http://localhost/api/syllabus/${ID}/signed-copy/${COPY}/file`),
    ctx,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth();
  mocks.syllabiGetOne.mockResolvedValue({
    id: ID,
    expand: { course: { code: "IT101" }, program: { code: "BSIT" } },
  });
  mocks.copiesGetOne.mockResolvedValue({ id: COPY, syllabus: ID, file: "scan.pdf" });
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.fetchVersionFile.mockResolvedValue(
    new Response("%PDF-1.7", { status: 200, headers: { "Content-Length": "8" } }),
  );
});

describe("GET /api/syllabus/:id/signed-copy/:copyId/file", () => {
  it("streams the scan with private, inline PDF headers", async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe(
      'inline; filename="IT101-BSIT-signed.pdf"',
    );
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Length")).toBe("8");
    expect(await res.text()).toBe("%PDF-1.7");
  });

  it("answers 404 without access, before loading the copy", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
    expect(mocks.copiesGetOne).not.toHaveBeenCalled();
  });

  it("answers 404 for another syllabus's copy", async () => {
    mocks.copiesGetOne.mockResolvedValue({ id: COPY, syllabus: "otherotherother" });
    expect((await get()).status).toBe(404);
    expect(mocks.fetchVersionFile).not.toHaveBeenCalled();
  });

  it("returns 502 when storage fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.fetchVersionFile.mockResolvedValue(new Response(null, { status: 500 }));
    expect((await get()).status).toBe(502);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.copiesGetOne.mockRejectedValue({ status: 404 });
    expect((await get()).status).toBe(404);
  });
});
