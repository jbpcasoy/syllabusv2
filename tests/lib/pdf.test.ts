import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { checkPdfUpload } from "@/lib/pdf";
import { MAX_PDF_BYTES } from "@/types/syllabus-version";

const pdf = (body = "%PDF-1.7\n...", type = "application/pdf") =>
  new File([body], "syllabus.pdf", { type });

describe("checkPdfUpload", () => {
  it("accepts a PDF", async () => {
    const file = pdf();
    expect(await checkPdfUpload(file)).toEqual({ ok: true, file });
  });

  it("accepts a PDF of exactly the limit", async () => {
    const body = new Uint8Array(MAX_PDF_BYTES);
    body.set([...("%PDF-")].map((c) => c.charCodeAt(0)));
    expect((await checkPdfUpload(new File([body], "a.pdf", { type: "application/pdf" }))).ok).toBe(true);
  });

  it.each([
    ["missing file", null],
    ["a string field", "%PDF-1.7"],
    ["an empty file", pdf("")],
  ])("asks for a file when given %s", async (_label, value) => {
    expect(await checkPdfUpload(value)).toEqual({
      ok: false,
      error: "Choose a PDF file to upload",
    });
  });

  it("rejects a non-PDF MIME type", async () => {
    expect(await checkPdfUpload(pdf("%PDF-1.7", "image/png"))).toEqual({
      ok: false,
      error: "Only PDF files are accepted",
    });
  });

  it("rejects a file over the limit", async () => {
    const body = new Uint8Array(MAX_PDF_BYTES + 1);
    body.set([...("%PDF-")].map((c) => c.charCodeAt(0)));
    expect(
      await checkPdfUpload(new File([body], "a.pdf", { type: "application/pdf" })),
    ).toEqual({ ok: false, error: "The PDF must be 20 MB or smaller" });
  });

  it("rejects a renamed file without PDF magic bytes", async () => {
    expect(await checkPdfUpload(pdf("<html>not a pdf</html>"))).toEqual({
      ok: false,
      error: "The file is not a valid PDF",
    });
  });
});
