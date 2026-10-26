import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  fetchVersionFile,
  latestVersionNo,
  toSyllabusVersionResponse,
  versionFileName,
} from "@/lib/syllabus-version";
import type { SyllabusVersion } from "@/types/syllabus-version";
import type PocketBase from "pocketbase";

const SYLLABUS = "sylsylsylsylsyl";

describe("toSyllabusVersionResponse", () => {
  it("never exposes the stored file name", () => {
    const response = toSyllabusVersionResponse({
      id: "ververververver",
      collectionId: "pbc_1800000006",
      collectionName: "syllabus_versions",
      syllabus: SYLLABUS,
      version_no: 2,
      file: "syllabus_ab12cd34ef.pdf",
      uploaded_by: "usrusrusrusrusr",
      notes: "Fixed CLOs",
      created: "2026-10-26 08:00:00.000Z",
      expand: {
        uploaded_by: { id: "usrusrusrusrusr", name: "Ana", email: "a@x" },
      },
    } as unknown as SyllabusVersion);

    expect(response).toEqual({
      id: "ververververver",
      syllabus: SYLLABUS,
      version_no: 2,
      notes: "Fixed CLOs",
      uploaded_by: "usrusrusrusrusr",
      created: "2026-10-26 08:00:00.000Z",
      expand: { uploaded_by: { id: "usrusrusrusrusr", name: "Ana" } },
    });
    expect(JSON.stringify(response)).not.toContain(".pdf");
  });
});

describe("versionFileName", () => {
  it("builds a safe inline file name", () => {
    expect(versionFileName("IT 101", "BSIT", 2)).toBe("IT101-BSIT-v2.pdf");
  });

  it("strips quotes and path characters and falls back when empty", () => {
    expect(versionFileName('a"b/../c', "", 1)).toBe("abc-syllabus-v1.pdf");
  });
});

describe("fetchVersionFile", () => {
  it("fetches with a file token and no caching", async () => {
    const response = new Response("pdf");
    const fetchMock = vi.fn(async () => response);
    vi.stubGlobal("fetch", fetchMock);
    const getURL = vi.fn(() => "http://pb/api/files/x/y/z.pdf?token=t");
    const pb = {
      files: { getToken: vi.fn(async () => "t"), getURL },
    } as unknown as PocketBase;
    const version = {
      id: "ververververver",
      collectionId: "pbc_1800000006",
      collectionName: "syllabus_versions",
      file: "z.pdf",
    };

    expect(await fetchVersionFile(pb, version)).toBe(response);
    expect(getURL).toHaveBeenCalledWith(version, "z.pdf", { token: "t" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://pb/api/files/x/y/z.pdf?token=t",
      { cache: "no-store" },
    );
    vi.unstubAllGlobals();
  });
});

describe("latestVersionNo", () => {
  const fakePb = (items: { version_no: number }[]) => {
    const getList = vi.fn(async () => ({ items }));
    const pb = {
      filter: (expr: string, params: Record<string, string>) =>
        expr.replace("{:syllabusId}", `"${params.syllabusId}"`),
      collection: vi.fn(() => ({ getList })),
    };
    return { pb: pb as unknown as PocketBase, getList };
  };

  it("returns the highest version number", async () => {
    const { pb, getList } = fakePb([{ version_no: 3 }]);
    expect(await latestVersionNo(pb, SYLLABUS)).toBe(3);
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      fields: "version_no",
      sort: "-version_no",
      filter: `syllabus = "${SYLLABUS}"`,
    });
  });

  it("returns 0 when there are no versions", async () => {
    const { pb } = fakePb([]);
    expect(await latestVersionNo(pb, SYLLABUS)).toBe(0);
  });
});
