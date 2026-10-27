import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  copyForm17,
  form17Facts,
  loadForm17,
  newRecordId,
  saveForm17,
} from "@/lib/form17";
import { checklistCriteria, CURRENT_FORM17 } from "@/lib/forms";
import type PocketBase from "pocketbase";

const VERSION = "ververververver";
const REVIEWER = "revwrevwrevwrev";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

const answer = (criterion: string, value = "yes", remarks = "") => ({
  id: `ans${criterion.toLowerCase()}ansans`.slice(0, 15),
  version: VERSION,
  criterion,
  answer: value,
  remarks,
  form_revision: "04",
  last_edited_by: REVIEWER,
  updated: "2026-10-27 08:00:00.000Z",
  expand: { last_edited_by: { name: "Rhea" } },
});

function fakePb(answers: unknown[] = [], changes: unknown[] = []) {
  const ops: unknown[][] = [];
  const send = vi.fn(async () => []);
  const lists: Record<string, ReturnType<typeof vi.fn>> = {
    form17_answers: vi.fn(async () => answers),
    form17_changes: vi.fn(async () => changes),
  };
  const pb = {
    filter,
    collection: (name: string) => ({ getFullList: lists[name] }),
    createBatch: () => ({
      collection: (name: string) => ({
        create: (body: unknown) => ops.push(["create", name, body]),
        update: (id: string, body: unknown) => ops.push(["update", name, id, body]),
      }),
      send,
    }),
  };
  return { pb: pb as unknown as PocketBase, ops, send, lists };
}

describe("newRecordId", () => {
  it("makes 15-character PocketBase-style ids", () => {
    for (let i = 0; i < 20; i++) expect(newRecordId()).toMatch(/^[a-z0-9]{15}$/);
    expect(newRecordId()).not.toBe(newRecordId());
  });
});

describe("form17Facts", () => {
  it("is complete and clean with every criterion Yes", async () => {
    const all = checklistCriteria(CURRENT_FORM17).map((c) => answer(c.key));
    const { pb, lists } = fakePb(all);

    expect(await form17Facts(pb, VERSION)).toEqual({ complete: true, hasNo: false });
    expect(lists.form17_answers).toHaveBeenCalledWith({
      expand: "last_edited_by",
      filter: `version = "${VERSION}"`,
    });
  });

  it("reports an incomplete checklist with a No", async () => {
    const { pb } = fakePb([answer("A1", "no", "Missing units")]);
    expect(await form17Facts(pb, VERSION)).toEqual({ complete: false, hasNo: true });
  });
});

describe("saveForm17", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates new answers at stage 1 without logging", async () => {
    const { pb, ops, send } = fakePb();

    await saveForm17(pb, {
      versionId: VERSION,
      stage: 1,
      by: REVIEWER,
      input: { answers: [{ criterion: "A1", answer: "yes", remarks: "" }] },
    });

    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual([
      "create",
      "form17_answers",
      expect.objectContaining({
        version: VERSION,
        criterion: "A1",
        answer: "yes",
        remarks: "",
        form_revision: "04",
        last_edited_by: REVIEWER,
      }),
    ]);
    expect((ops[0][2] as { id: string }).id).toMatch(/^[a-z0-9]{15}$/);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("logs a later reviewer's change with before and after", async () => {
    const { pb, ops } = fakePb([answer("F6", "yes")]);

    await saveForm17(pb, {
      versionId: VERSION,
      stage: 3,
      by: "fdisfdisfdisfdi",
      input: { answers: [{ criterion: "F6", answer: "no", remarks: "Only 3." }] },
    });

    expect(ops).toEqual([
      [
        "update",
        "form17_answers",
        answer("F6").id,
        { answer: "no", remarks: "Only 3.", last_edited_by: "fdisfdisfdisfdi" },
      ],
      [
        "create",
        "form17_changes",
        {
          answer: answer("F6").id,
          stage: 3,
          by: "fdisfdisfdisfdi",
          from_answer: "yes",
          to_answer: "no",
          from_remarks: "",
          to_remarks: "Only 3.",
        },
      ],
    ]);
  });

  it("logs an answer a later reviewer creates against its new id", async () => {
    const { pb, ops } = fakePb();

    await saveForm17(pb, {
      versionId: VERSION,
      stage: 2,
      by: "deandeandeandea",
      input: { answers: [{ criterion: "B1", answer: "yes", remarks: "" }] },
    });

    const created = ops[0][2] as { id: string };
    expect(ops[1]).toEqual([
      "create",
      "form17_changes",
      expect.objectContaining({ answer: created.id, from_answer: "", to_answer: "yes" }),
    ]);
  });

  it("skips unchanged answers and sends nothing when nothing changed", async () => {
    const { pb, ops, send } = fakePb([answer("A1", "yes", "")]);

    await saveForm17(pb, {
      versionId: VERSION,
      stage: 4,
      by: REVIEWER,
      input: { answers: [{ criterion: "A1", answer: "yes", remarks: "" }] },
    });

    expect(ops).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it("saves suggestions on the version", async () => {
    const { pb, ops } = fakePb();

    await saveForm17(pb, {
      versionId: VERSION,
      stage: 1,
      by: REVIEWER,
      input: { answers: [], suggestions: "Tighten the COs." },
    });

    expect(ops).toEqual([
      ["update", "syllabus_versions", VERSION, { form17_suggestions: "Tighten the COs." }],
    ]);
  });
});

describe("copyForm17", () => {
  it("copies answers with their revision and editor, plus suggestions", () => {
    const ops: unknown[][] = [];
    const batch = {
      collection: (name: string) => ({
        create: (body: unknown) => ops.push(["create", name, body]),
        update: (id: string, body: unknown) => ops.push(["update", name, id, body]),
      }),
    };

    copyForm17(
      batch as never,
      { answers: [answer("A1"), answer("F6", "no", "Only 3.")] as never, suggestions: "More refs." },
      "newvernewvernew",
    );

    expect(ops).toEqual([
      [
        "create",
        "form17_answers",
        {
          version: "newvernewvernew",
          criterion: "A1",
          answer: "yes",
          remarks: "",
          form_revision: "04",
          last_edited_by: REVIEWER,
        },
      ],
      [
        "create",
        "form17_answers",
        expect.objectContaining({ criterion: "F6", answer: "no", remarks: "Only 3." }),
      ],
      ["update", "syllabus_versions", "newvernewvernew", { form17_suggestions: "More refs." }],
    ]);
  });

  it("leaves suggestions alone when there are none", () => {
    const ops: unknown[][] = [];
    const batch = {
      collection: () => ({
        create: (body: unknown) => ops.push(["create", body]),
        update: () => ops.push(["update"]),
      }),
    };
    copyForm17(batch as never, { answers: [], suggestions: "" }, "v");
    expect(ops).toEqual([]);
  });
});

describe("loadForm17", () => {
  it("maps answers, flags and the change log to a safe shape", async () => {
    const { pb, lists } = fakePb(
      [answer("A1", "no", "Units missing")],
      [
        {
          stage: 2,
          by: "deandeandeandea",
          from_answer: "yes",
          to_answer: "no",
          from_remarks: "",
          to_remarks: "Units missing",
          created: "2026-10-27 09:00:00.000Z",
          expand: {
            by: { name: "Dean D", tokenKey: "secret" },
            answer: { criterion: "A1" },
          },
        },
      ],
    );

    const response = await loadForm17(pb, {
      id: VERSION,
      version_no: 2,
      form17_suggestions: "Fix units.",
    });

    expect(response).toEqual({
      version: { id: VERSION, version_no: 2 },
      form_revision: "04",
      answers: [
        {
          criterion: "A1",
          answer: "no",
          remarks: "Units missing",
          last_edited_by: { id: REVIEWER, name: "Rhea" },
          updated: "2026-10-27 08:00:00.000Z",
        },
      ],
      suggestions: "Fix units.",
      complete: false,
      has_no: true,
      changes: [
        {
          criterion: "A1",
          stage: 2,
          by: { id: "deandeandeandea", name: "Dean D" },
          from_answer: "yes",
          to_answer: "no",
          from_remarks: "",
          to_remarks: "Units missing",
          created: "2026-10-27 09:00:00.000Z",
        },
      ],
    });
    expect(JSON.stringify(response)).not.toContain("secret");
    expect(lists.form17_changes).toHaveBeenCalledWith({
      expand: "by,answer",
      sort: "created",
      filter: `answer.version = "${VERSION}"`,
    });
  });

  it("reports the current revision for an empty checklist", async () => {
    const { pb } = fakePb();
    const response = await loadForm17(pb, { id: VERSION, version_no: 1 });
    expect(response.form_revision).toBe("04");
    expect(response.suggestions).toBe("");
    expect(response.complete).toBe(false);
  });
});
