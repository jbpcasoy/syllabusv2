import { buildTimeline } from "@/lib/syllabus-timeline";
import { describe, expect, it } from "vitest";

const base = {
  stage: 0,
  version_no: null,
  actor_name: "",
  approval_code: "",
  reason: "",
};

describe("buildTimeline", () => {
  it("starts with the draft's creation", () => {
    expect(
      buildTimeline({ createdAt: "2026-01-01 08:00:00.000Z", versions: [], events: [] }),
    ).toEqual([{ ...base, kind: "created", at: "2026-01-01 08:00:00.000Z" }]);
  });

  it("merges uploads and events oldest first, naming people", () => {
    const entries = buildTimeline({
      createdAt: "2026-01-01 08:00:00.000Z",
      versions: [
        {
          id: "v1",
          version_no: 1,
          created: "2026-01-02 08:00:00.000Z",
          expand: { uploaded_by: { name: "Lea" } },
        },
        { id: "v2", version_no: 2, created: "2026-01-05 08:00:00.000Z" },
      ],
      events: [
        {
          type: "submitted",
          created: "2026-01-03 08:00:00.000Z",
          stage: 1,
          version: "v1",
          approval_code: "",
          reason: "",
          expand: { actor: { name: "Lea" } },
        },
        {
          type: "returned",
          created: "2026-01-04 08:00:00.000Z",
          stage: 1,
          version: "v1",
          approval_code: "",
          reason: "",
          expand: { actor: { name: "Rey" } },
        },
        {
          type: "approved",
          created: "2026-01-06 08:00:00.000Z",
          stage: 1,
          version: "v2",
          approval_code: "SYL-2627-1-0001-S1",
          reason: "",
          expand: { actor: { name: "Rey" } },
        },
        {
          type: "scan_returned",
          created: "2026-01-07 08:00:00.000Z",
          stage: 0,
          version: "",
          approval_code: "",
          reason: "Blurry",
        },
      ],
    });

    expect(entries.map((e) => [e.kind, e.version_no, e.actor_name])).toEqual([
      ["created", null, ""],
      ["uploaded", 1, "Lea"],
      ["submitted", 1, "Lea"],
      ["returned", 1, "Rey"],
      ["uploaded", 2, ""],
      ["approved", 2, "Rey"],
      ["scan_returned", null, ""],
    ]);
    expect(entries[5]).toMatchObject({ stage: 1, approval_code: "SYL-2627-1-0001-S1" });
    expect(entries[6].reason).toBe("Blurry");
  });

  it("keeps an upload before an event stamped the same instant", () => {
    const at = "2026-01-02 08:00:00.000Z";
    const entries = buildTimeline({
      createdAt: "2026-01-01 08:00:00.000Z",
      versions: [{ id: "v1", version_no: 1, created: at }],
      events: [
        { type: "resubmitted", created: at, stage: 2, version: "v1", approval_code: "", reason: "" },
      ],
    });
    expect(entries.map((e) => e.kind)).toEqual(["created", "uploaded", "resubmitted"]);
  });

  it("leaves the version number empty for an unknown version", () => {
    const [, event] = buildTimeline({
      createdAt: "2026-01-01 08:00:00.000Z",
      versions: [],
      events: [
        { type: "submitted", created: "2026-01-02 08:00:00.000Z", stage: 1, version: "gone", approval_code: "", reason: "" },
      ],
    });
    expect(event.version_no).toBeNull();
  });
});
