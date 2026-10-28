import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listPoints, loadForm18, toPointResponse } from "@/lib/form18";
import type { Form18Point } from "@/types/form18";
import type PocketBase from "pocketbase";

const ID = "sylsylsylsylsyl";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

const point = {
  id: "pntpntpntpntpnt",
  syllabus: ID,
  version: "v1v1v1v1v1v1v1v",
  part: "B",
  stage: 3,
  code: "B.3",
  review_point: "CO 2 and IAS don't connect.",
  action_taken: "Added case-based learning.",
  page_number: "4",
  remarks: "",
  status: "responded",
  form_revision: "01",
  raised_by: "fdisfdisfdisfdi",
  responded_by: "leadleadleadlea",
  judged_by: "",
  created: "2026-10-27 08:00:00.000Z",
  updated: "2026-10-27 09:00:00.000Z",
  expand: {
    raised_by: { name: "Fe", tokenKey: "secret" },
    responded_by: { name: "Lea" },
    version: { version_no: 2 },
  },
} as unknown as Form18Point;

describe("toPointResponse", () => {
  it("maps to a safe shape, with null for nobody", () => {
    const response = toPointResponse(point);
    expect(response).toEqual({
      id: "pntpntpntpntpnt",
      version: "v1v1v1v1v1v1v1v",
      version_no: 2,
      part: "B",
      stage: 3,
      code: "B.3",
      review_point: "CO 2 and IAS don't connect.",
      action_taken: "Added case-based learning.",
      page_number: "4",
      remarks: "",
      status: "responded",
      raised_by: { id: "fdisfdisfdisfdi", name: "Fe" },
      responded_by: { id: "leadleadleadlea", name: "Lea" },
      judged_by: null,
      created: "2026-10-27 08:00:00.000Z",
      updated: "2026-10-27 09:00:00.000Z",
    });
    expect(JSON.stringify(response)).not.toContain("secret");
  });

  it("reports version 0 when the version didn't expand", () => {
    expect(toPointResponse({ ...point, expand: {} }).version_no).toBe(0);
  });
});

describe("listPoints and loadForm18", () => {
  it("reads every point of the syllabus by stage", async () => {
    const getFullList = vi.fn(async () => [point]);
    const pb = { filter, collection: () => ({ getFullList }) } as unknown as PocketBase;

    expect(await listPoints(pb, ID)).toEqual([point]);
    expect(getFullList).toHaveBeenCalledWith({
      expand: "raised_by,responded_by,judged_by,version",
      sort: "stage,created",
      filter: `syllabus = "${ID}"`,
    });

    const form = await loadForm18(pb, ID);
    expect(form.form_revision).toBe("01");
    expect(form.points).toHaveLength(1);
  });

  it("reports the current revision when there are no points", async () => {
    const pb = {
      filter,
      collection: () => ({ getFullList: vi.fn(async () => []) }),
    } as unknown as PocketBase;
    expect(await loadForm18(pb, ID)).toEqual({ form_revision: "01", points: [] });
  });
});
