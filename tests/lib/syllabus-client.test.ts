import {
  createSyllabus,
  deleteSyllabus,
  listAvailableSyllabi,
  listSyllabi,
  syllabusVersionFileUrl,
  uploadSyllabusVersion,
} from "@/lib/syllabus-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  // A fresh Response per call: a body can only be read once.
  fetchMock.mockImplementation(async () => Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("syllabus client", () => {
  it("sends JSON with a JSON content type", async () => {
    await createSyllabus({ course: "c", term: "t", program: "p" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/syllabus");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"course":"c","term":"t","program":"p"}');
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("uploads multipart without overriding the content type", async () => {
    const file = new File(["%PDF-"], "s.pdf", { type: "application/pdf" });

    await uploadSyllabusVersion("syl", file, "notes");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/syllabus/syl/version");
    expect(init.headers).toEqual({});
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect((init.body as FormData).get("notes")).toBe("notes");
  });

  it("drops empty list params", async () => {
    await listSyllabi({ page: 2, perPage: 10, search: "", status: "draft" });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/syllabus?page=2&perPage=10&status=draft",
    );

    await listAvailableSyllabi({ page: 1, perPage: 10, term: "t" });
    expect(fetchMock.mock.calls[1][0]).toBe(
      "/api/syllabus/available?page=1&perPage=10&term=t",
    );
  });

  it("throws the API's error message", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: "This term is closed for submissions." }, { status: 409 }),
    );
    await expect(
      createSyllabus({ course: "c", term: "t", program: "p" }),
    ).rejects.toThrow("This term is closed for submissions.");
  });

  it("resolves a 204 without parsing a body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deleteSyllabus("syl")).resolves.toBeUndefined();
  });

  it("builds the scoped file URL", () => {
    expect(syllabusVersionFileUrl("syl", "ver")).toBe(
      "/api/syllabus/syl/version/ver/file",
    );
  });
});
