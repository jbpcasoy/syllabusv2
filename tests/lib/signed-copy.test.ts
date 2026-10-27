import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  listSignedCopies,
  signedCopyFileName,
  toSignedCopyResponse,
} from "@/lib/signed-copy";
import type { SignedCopy } from "@/types/signed-copy";
import type PocketBase from "pocketbase";

const ID = "sylsylsylsylsyl";

const copy = {
  id: "cpycpycpycpycpy",
  syllabus: ID,
  file: "scan_abc.pdf",
  uploaded_by: "leadleadleadlea",
  status: "returned",
  reason: "Missing signature.",
  returned_by: "vpaavpaavpaavpa",
  returned_at: "2026-10-28 08:00:00.000Z",
  created: "2026-10-27 08:00:00.000Z",
  expand: {
    uploaded_by: { name: "Lea", tokenKey: "secret" },
    returned_by: { name: "Vee" },
  },
} as unknown as SignedCopy;

describe("toSignedCopyResponse", () => {
  it("maps to a safe shape without the stored file name", () => {
    const response = toSignedCopyResponse(copy);
    expect(response).toEqual({
      id: "cpycpycpycpycpy",
      status: "returned",
      reason: "Missing signature.",
      uploaded_by: { id: "leadleadleadlea", name: "Lea" },
      returned_by: { id: "vpaavpaavpaavpa", name: "Vee" },
      returned_at: "2026-10-28 08:00:00.000Z",
      created: "2026-10-27 08:00:00.000Z",
    });
    expect(JSON.stringify(response)).not.toContain("scan_abc");
    expect(JSON.stringify(response)).not.toContain("secret");
  });

  it("has no returner while valid", () => {
    expect(
      toSignedCopyResponse({ ...copy, status: "valid", returned_by: "" })
        .returned_by,
    ).toBeNull();
  });
});

describe("listSignedCopies", () => {
  it("reads newest first", async () => {
    const getFullList = vi.fn(async () => [copy]);
    const pb = {
      filter: (expr: string, params: Record<string, unknown>) =>
        expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key])),
      collection: () => ({ getFullList }),
    } as unknown as PocketBase;

    expect(await listSignedCopies(pb, ID)).toHaveLength(1);
    expect(getFullList).toHaveBeenCalledWith({
      expand: "uploaded_by,returned_by",
      sort: "-created",
      filter: `syllabus = "${ID}"`,
    });
  });
});

describe("signedCopyFileName", () => {
  it("keeps letters, digits and dashes", () => {
    expect(signedCopyFileName("IT 101", "BS-IT")).toBe("IT101-BS-IT-signed.pdf");
    expect(signedCopyFileName("", "")).toBe("syllabus-syllabus-signed.pdf");
  });
});
