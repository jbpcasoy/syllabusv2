import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  versionsGetOne: vi.fn(),
  getSyllabusAccess: vi.fn(),
  fetchVersionFile: vi.fn(),
  versionFileName: vi.fn(() => "IT101-BSIT-v2.pdf"),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collections: Record<string, unknown> = {
    syllabi: { getOne: mocks.syllabiGetOne },
    syllabus_versions: { getOne: mocks.versionsGetOne },
  };
  return {
    createAdminPb: vi.fn(async () => ({
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
  resolveSyllabusAccess: vi.fn(async (...args: unknown[]) =>
    mocks.getSyllabusAccess(...args),
  ),
}));
vi.mock("@/lib/syllabus-version", () => ({
  fetchVersionFile: mocks.fetchVersionFile,
  versionFileName: mocks.versionFileName,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET } from "@/app/api/syllabus/[id]/version/[versionId]/file/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const VERSION = "ververververver";
const ME = "me1me1me1me1me1";
const ctx = { params: Promise.resolve({ id: ID, versionId: VERSION }) };

const syllabus = {
  id: ID,
  lead: ME,
  co_authors: [],
  expand: { course: { code: "IT 101" }, program: { code: "BSIT" } },
};
const version = {
  id: VERSION,
  syllabus: ID,
  version_no: 2,
  file: "stored_abc123.pdf",
};

function get() {
  return new NextRequest(
    `http://localhost/api/syllabus/${ID}/version/${VERSION}/file`,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME });
  mocks.syllabiGetOne.mockResolvedValue(syllabus);
  mocks.versionsGetOne.mockResolvedValue(version);
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.fetchVersionFile.mockResolvedValue(
    new Response("%PDF-1.7 bytes", {
      headers: { "Content-Length": "14" },
    }),
  );
});

describe("GET /api/syllabus/:id/version/:versionId/file", () => {
  it.each(["lead", "coAuthor", "admin", "referencer"])(
    "streams the PDF with safe headers for %s access",
    async (access) => {
      mocks.getSyllabusAccess.mockReturnValue(access);

      const res = await GET(get(), ctx);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("%PDF-1.7 bytes");
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toBe(
        'inline; filename="IT101-BSIT-v2.pdf"',
      );
      expect(res.headers.get("Cache-Control")).toBe("private, no-store");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Content-Length")).toBe("14");
      expect(mocks.versionFileName).toHaveBeenCalledWith("IT 101", "BSIT", 2);
      expect(mocks.fetchVersionFile).toHaveBeenCalledWith(
        expect.anything(),
        version,
      );
    },
  );

  it("never leaks the storage URL or stored file name", async () => {
    const res = await GET(get(), ctx);
    const headers = JSON.stringify([...res.headers.entries()]);
    expect(headers).not.toContain("stored_abc123");
    expect(headers).not.toContain("/api/files/");
  });

  it("answers 404 when the caller has no access, before loading the version", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await GET(get(), ctx);
    expect(res.status).toBe(404);
    expect(mocks.versionsGetOne).not.toHaveBeenCalled();
    expect(mocks.fetchVersionFile).not.toHaveBeenCalled();
  });

  it("answers 404 for a version of another syllabus", async () => {
    mocks.versionsGetOne.mockResolvedValue({
      ...version,
      syllabus: "othersyllabus12",
    });
    const res = await GET(get(), ctx);
    expect(res.status).toBe(404);
    expect(mocks.fetchVersionFile).not.toHaveBeenCalled();
  });

  it("returns 502 when storage fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.fetchVersionFile.mockResolvedValue(new Response(null, { status: 500 }));
    const res = await GET(get(), ctx);
    expect(res.status).toBe(502);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(get(), ctx);
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 for a missing syllabus or version", async () => {
    mocks.versionsGetOne.mockRejectedValue({ status: 404 });
    const res = await GET(get(), ctx);
    expect(res.status).toBe(404);
  });
});
