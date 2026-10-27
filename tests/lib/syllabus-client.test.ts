import {
  createReviewPoint,
  createSyllabus,
  deleteReviewPoint,
  deleteSyllabus,
  getForm17,
  getJustification,
  getJustificationLetter,
  justificationScanUrl,
  returnJustification,
  saveJustification,
  uploadJustificationScan,
  getForm17Export,
  getForm18,
  getForm181Export,
  saveForm17,
  updateReviewPoint,
  listAvailableSyllabi,
  listLeadCandidates,
  startFromPrevious,
  transferLead,
  listSignedCopies,
  returnSignedCopy,
  signedCopyFileUrl,
  uploadSignedCopy,
  listStandInCandidates,
  listStandIns,
  listSyllabi,
  resubmitSyllabus,
  reviewSyllabus,
  setStandIn,
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

  it("asks for the review queue with scope=review", async () => {
    await listSyllabi({ page: 1, perPage: 10, scope: "review" });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/syllabus?page=1&perPage=10&scope=review",
    );
  });

  it("posts review decisions and resubmissions", async () => {
    await reviewSyllabus("syl", "return");
    let [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/syllabus/syl/review");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"decision":"return"}');

    await resubmitSyllabus("syl");
    [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/syllabus/syl/resubmit");
    expect(init.method).toBe("POST");
  });

  it("reads, sets and searches stand-ins", async () => {
    await listStandIns("syl");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/syllabus/syl/stand-in");

    await setStandIn("syl", { stage: 1, user: null });
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/syllabus/syl/stand-in");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"stage":1,"user":null}');

    await listStandInCandidates("syl", 3, "ana");
    expect(fetchMock.mock.calls[2][0]).toBe(
      "/api/syllabus/syl/stand-in-candidates?stage=3&search=ana",
    );
  });

  it("reads and saves Form 17", async () => {
    await getForm17("syl");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/syllabus/syl/form17?");

    await getForm17("syl", "ver");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/syllabus/syl/form17?version=ver");

    await saveForm17("syl", { answers: [], suggestions: "x" });
    const [url, init] = fetchMock.mock.calls[2];
    expect(url).toBe("/api/syllabus/syl/form17");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"answers":[],"suggestions":"x"}');
  });

  it("reads and changes Form 18-1 points", async () => {
    await getForm18("syl");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/syllabus/syl/form18");

    await createReviewPoint("syl", { review_point: "p", code: "", remarks: "" });
    expect(fetchMock.mock.calls[1][1].method).toBe("POST");

    await updateReviewPoint("syl", "pt", { action: "judge", status: "resolved" });
    expect(fetchMock.mock.calls[2][0]).toBe("/api/syllabus/syl/form18/pt");
    expect(fetchMock.mock.calls[2][1].method).toBe("PATCH");

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await deleteReviewPoint("syl", "pt");
    expect(fetchMock.mock.calls[3][1].method).toBe("DELETE");
  });

  it("transfers the lead, searches candidates and starts from last year", async () => {
    await transferLead("syl", { lead: "u", keep_previous: false });
    let [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/syllabus/syl/lead");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"lead":"u","keep_previous":false}');

    await listLeadCandidates("syl", "an");
    expect(fetchMock.mock.calls[1][0]).toBe(
      "/api/syllabus/syl/lead-candidates?search=an",
    );

    await startFromPrevious("syl");
    [url, init] = fetchMock.mock.calls[2];
    expect(url).toBe("/api/syllabus/syl/version/from-previous");
    expect(init.method).toBe("POST");
  });

  it("reads, saves, submits and returns the justification", async () => {
    await getJustification("syl");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/syllabus/syl/justification");

    await saveJustification("syl", [{ author: "a", reason: "r" }]);
    let [url, init] = fetchMock.mock.calls[1];
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"entries":[{"author":"a","reason":"r"}]}');

    await uploadJustificationScan("syl", new File(["%PDF-"], "l.pdf", { type: "application/pdf" }));
    [url, init] = fetchMock.mock.calls[2];
    expect(url).toBe("/api/syllabus/syl/justification/scan");
    expect(init.body).toBeInstanceOf(FormData);

    await returnJustification("syl", "Wrong term.");
    [url, init] = fetchMock.mock.calls[3];
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe('{"action":"return","reason":"Wrong term."}');

    await getJustificationLetter("syl");
    expect(fetchMock.mock.calls[4][0]).toBe("/api/syllabus/syl/export/justification");
    expect(justificationScanUrl("syl")).toBe("/api/syllabus/syl/justification/scan");
  });

  it("lists, uploads and returns signed copies", async () => {
    await listSignedCopies("syl");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/syllabus/syl/signed-copy");

    const file = new File(["%PDF-"], "s.pdf", { type: "application/pdf" });
    await uploadSignedCopy("syl", file);
    let [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/syllabus/syl/signed-copy");
    expect(init.headers).toEqual({});
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);

    await returnSignedCopy("syl", "cpy", "Missing signature.");
    [url, init] = fetchMock.mock.calls[2];
    expect(url).toBe("/api/syllabus/syl/signed-copy/cpy");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe('{"reason":"Missing signature."}');

    expect(signedCopyFileUrl("syl", "cpy")).toBe(
      "/api/syllabus/syl/signed-copy/cpy/file",
    );
  });

  it("fetches export data", async () => {
    await getForm17Export("syl");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/syllabus/syl/export/form17?");
    await getForm17Export("syl", undefined, "ver");
    expect(fetchMock.mock.calls[1][0]).toBe(
      "/api/syllabus/syl/export/form17?version=ver",
    );
    await getForm181Export("syl");
    expect(fetchMock.mock.calls[2][0]).toBe("/api/syllabus/syl/export/form18");
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
