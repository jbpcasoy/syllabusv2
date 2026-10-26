import {
  CHAIN_ROLES,
  INITIAL_STATE,
  SYLLABUS_STATUSES,
  transition,
  type SubmitEvent,
  type WorkflowState,
} from "@/lib/syllabus-workflow";
import { describe, expect, it } from "vitest";

const DRAFT: WorkflowState = { status: "draft", stage: 0 };
const READY: SubmitEvent = {
  type: "submit",
  hasVersion: true,
  termOpen: true,
  missingRoles: [],
};

describe("transition: submit", () => {
  it("moves a ready draft to stage 1", () => {
    expect(transition(DRAFT, READY)).toEqual({
      ok: true,
      next: { status: "submitted", stage: 1 },
    });
  });

  it("rejects a syllabus that is already submitted", () => {
    const result = transition({ status: "submitted", stage: 1 }, READY);
    expect(result).toEqual({
      ok: false,
      error: "Only a draft syllabus can be submitted.",
    });
  });

  it("requires an uploaded version", () => {
    const result = transition(DRAFT, { ...READY, hasVersion: false });
    expect(result).toEqual({
      ok: false,
      error: "Upload a PDF version before submitting.",
    });
  });

  it("requires an open term", () => {
    const result = transition(DRAFT, { ...READY, termOpen: false });
    expect(result).toEqual({
      ok: false,
      error: "This term is closed for submissions.",
    });
  });

  it("names every missing reviewer role in chain order", () => {
    const result = transition(DRAFT, {
      ...READY,
      missingRoles: ["vpaa", "programChair", "dean"],
    });
    expect(result).toEqual({
      ok: false,
      error:
        "The review chain is incomplete. No active Program Chair, Dean, VPAA.",
    });
  });

  it("reports the status problem before any other", () => {
    const result = transition(
      { status: "submitted", stage: 1 },
      { type: "submit", hasVersion: false, termOpen: false, missingRoles: ["vpaa"] },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Only a draft/);
  });

  it("does not mutate its input", () => {
    const state = { ...DRAFT };
    const event = { ...READY, missingRoles: ["dean" as const, "vpaa" as const] };
    transition(state, event);
    expect(state).toEqual(DRAFT);
    expect(event.missingRoles).toEqual(["dean", "vpaa"]);
  });
});

describe("constants", () => {
  it("lists the six chain roles in review order", () => {
    expect(CHAIN_ROLES.map((r) => r.key)).toEqual([
      "programChair",
      "departmentHead",
      "dean",
      "fdisChair",
      "citlDirector",
      "vpaa",
    ]);
    expect(CHAIN_ROLES.map((r) => r.stage)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("starts every syllabus as an unrouted draft", () => {
    expect(INITIAL_STATE).toEqual({ status: "draft", stage: 0 });
  });

  it("has the Phase 2 statuses", () => {
    expect(SYLLABUS_STATUSES).toEqual(["draft", "submitted"]);
  });
});
