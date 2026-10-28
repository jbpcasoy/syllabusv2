import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  batchOps: [] as unknown[][],
  batchSend: vi.fn(),
  copiesCreate: vi.fn(),
  copiesDelete: vi.fn(),
  getSyllabusAccess: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  listSignedCopies: vi.fn(),
  checkPdfUpload: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi"
      ? { getOne: mocks.syllabiGetOne }
      : { create: mocks.copiesCreate, delete: mocks.copiesDelete };
  const batch = {
    collection: (name: string) => ({
      create: (body: unknown) => mocks.batchOps.push(["create", name, body]),
      update: (id: string, body: unknown) =>
        mocks.batchOps.push(["update", name, id, body]),
    }),
    send: mocks.batchSend,
  };
  return {
    createAdminPb: vi.fn(async () => ({ collection, createBatch: () => batch })),
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
  getSyllabusAccess: mocks.getSyllabusAccess,
  resolveSyllabusAccess: mocks.resolveSyllabusAccess,
}));
vi.mock("@/lib/signed-copy", () => ({
  SIGNED_COPY_EXPAND: "uploaded_by,returned_by",
  listSignedCopies: mocks.listSignedCopies,
  toSignedCopyResponse: (record: object) => ({ ...record, mapped: true }),
}));
vi.mock("@/lib/syllabus-decision", () => ({
  hasNotUniqueError: (error: { code?: string }) =>
    error?.code === "validation_not_unique",
}));
vi.mock("@/lib/pdf", () => ({ checkPdfUpload: mocks.checkPdfUpload }));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

// The workflow stays real: filing is its decision.
import { GET, POST } from "@/app/api/syllabus/[id]/signed-copy/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const ME = "leadleadleadlea";
const ctx = { params: Promise.resolve({ id: ID }) };
const pdf = new File(["%PDF-1.7"], "scan.pdf", { type: "application/pdf" });
const syllabus = (status = "approved") => ({ id: ID, lead: ME, co_authors: [], status, stage: 5 });

function upload() {
  const form = new FormData();
  form.set("file", pdf);
  return POST(
    new NextRequest(`http://localhost/api/syllabus/${ID}/signed-copy`, {
      method: "POST",
      body: form,
    }),
    ctx,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME });
  mocks.syllabiGetOne.mockResolvedValue(syllabus());
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.resolveSyllabusAccess.mockResolvedValue("lead");
  mocks.checkPdfUpload.mockResolvedValue({ ok: true, file: pdf });
  mocks.copiesCreate.mockImplementation(async (data: object) => ({ id: "cpy", ...data }));
  mocks.batchOps.length = 0;
  mocks.batchSend.mockResolvedValue([]);
  mocks.listSignedCopies.mockResolvedValue([{ id: "cpy" }]);
});

describe("GET /api/syllabus/:id/signed-copy", () => {
  const get = () =>
    GET(new NextRequest(`http://localhost/api/syllabus/${ID}/signed-copy`), ctx);

  it("lists copies for a caller with access", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [{ id: "cpy" }] });
  });

  it("answers 404 without access", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
    expect(mocks.listSignedCopies).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("POST /api/syllabus/:id/signed-copy", () => {
  it("stores the scan, then files the syllabus with its event in one batch", async () => {
    const res = await upload();

    expect(res.status).toBe(201);
    expect(mocks.copiesCreate).toHaveBeenCalledWith(
      { syllabus: ID, file: pdf, uploaded_by: ME, status: "valid" },
      { expand: "uploaded_by,returned_by" },
    );
    expect(mocks.batchOps).toEqual([
      [
        "update",
        "syllabi",
        ID,
        { status: "filed", stage: 5, status_changed_at: expect.any(String) },
      ],
      [
        "create",
        "syllabus_events",
        {
          syllabus: ID,
          type: "filed",
          actor: ME,
          stage: 0,
          version: "",
          approval_code: "",
          reason: "",
        },
      ],
    ]);
    expect(mocks.batchSend).toHaveBeenCalledTimes(1);
    expect(await res.json()).toMatchObject({ mapped: true, status: "valid" });
  });

  it("returns 400 for a bad file before touching PocketBase", async () => {
    mocks.checkPdfUpload.mockResolvedValue({ ok: false, error: "The file is not a valid PDF" });
    const res = await upload();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "The file is not a valid PDF" });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-multipart body", async () => {
    const res = await POST(
      new NextRequest(`http://localhost/api/syllabus/${ID}/signed-copy`, {
        method: "POST",
        body: "nope",
      }),
      ctx,
    );
    expect(res.status).toBe(400);
  });

  it.each(["draft", "submitted", "returned", "filed"])(
    "returns 409 while %s",
    async (status) => {
      mocks.syllabiGetOne.mockResolvedValue(syllabus(status));
      const res = await upload();
      expect(res.status).toBe(409);
      expect(mocks.copiesCreate).not.toHaveBeenCalled();
    },
  );

  it("returns 409 when a valid copy is already on file", async () => {
    mocks.copiesCreate.mockRejectedValue({ code: "validation_not_unique" });
    const res = await upload();
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "A valid signed copy is already on file." });
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("removes the copy again when filing fails", async () => {
    mocks.batchSend.mockRejectedValue({ status: 400 });
    const res = await upload();
    expect(res.status).toBe(400);
    expect(mocks.copiesDelete).toHaveBeenCalledWith("cpy");
    expect(handlePbError).toHaveBeenCalled();
  });

  it.each(["coAuthor", "reviewer", "admin", "referencer"])(
    "returns 403 for %s access",
    async (access) => {
      mocks.getSyllabusAccess.mockReturnValue(access);
      expect((await upload()).status).toBe(403);
      expect(mocks.copiesCreate).not.toHaveBeenCalled();
    },
  );

  it("answers 404 without access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    expect((await upload()).status).toBe(404);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await upload()).status).toBe(401);
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    expect((await upload()).status).toBe(404);
  });
});
