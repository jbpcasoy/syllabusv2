import { MAX_PDF_BYTES } from "@/types/syllabus-version";
import "server-only";

const PDF_MAGIC = "%PDF-";

type PdfCheck = { ok: true; file: File } | { ok: false; error: string };

/**
 * Validates a multipart `file` entry: a non-empty File, PDF MIME type, at
 * most MAX_PDF_BYTES, and starting with the "%PDF-" magic bytes. The MIME
 * type comes from the browser, so the magic bytes are the real check.
 */
export async function checkPdfUpload(value: unknown): Promise<PdfCheck> {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: false, error: "Choose a PDF file to upload" };
  }
  if (value.type !== "application/pdf") {
    return { ok: false, error: "Only PDF files are accepted" };
  }
  if (value.size > MAX_PDF_BYTES) {
    return {
      ok: false,
      error: `The PDF must be ${MAX_PDF_BYTES / 1024 / 1024} MB or smaller`,
    };
  }
  const head = new Uint8Array(
    await value.slice(0, PDF_MAGIC.length).arrayBuffer(),
  );
  if (String.fromCharCode(...head) !== PDF_MAGIC) {
    return { ok: false, error: "The file is not a valid PDF" };
  }
  return { ok: true, file: value };
}
