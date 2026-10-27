import {
  editError,
  eligibleAuthors,
  returnError,
  submitScanError,
} from "@/lib/syllabus-justification";
import { describe, expect, it } from "vitest";

describe("eligibleAuthors", () => {
  it("lists previous authors who aren't current authors, lead first", () => {
    expect(
      eligibleAuthors(
        { lead: "ana", co_authors: ["ben", "cy"] },
        { lead: "dee", co_authors: ["cy"] },
      ),
    ).toEqual(["ana", "ben"]);
  });

  it("is empty when the same lead continues alone", () => {
    expect(
      eligibleAuthors({ lead: "ana", co_authors: [] }, { lead: "ana", co_authors: [] }),
    ).toEqual([]);
  });

  it("drops a previous author who is now a co-author", () => {
    expect(
      eligibleAuthors({ lead: "ana", co_authors: [] }, { lead: "dee", co_authors: ["ana"] }),
    ).toEqual([]);
  });

  it("drops duplicates and blanks", () => {
    expect(
      eligibleAuthors({ lead: "ana", co_authors: ["ana", ""] }, { lead: "dee", co_authors: [] }),
    ).toEqual(["ana"]);
  });
});

describe("editError", () => {
  it.each(["draft", "submitted", "returned"] as const)("refuses before approval (%s)", (status) => {
    expect(editError(status, null)).toBe(
      "A justification can be written once the syllabus is approved.",
    );
  });

  it.each(["approved", "filed"] as const)("allows writing once %s", (status) => {
    expect(editError(status, null)).toBeNull();
    expect(editError(status, "draft")).toBeNull();
    expect(editError(status, "returned")).toBeNull();
  });

  it("locks the entries while submitted", () => {
    expect(editError("approved", "submitted")).toMatch(/only if it is returned/);
  });
});

describe("submitScanError", () => {
  it("needs a draft or returned justification with entries", () => {
    expect(submitScanError("approved", "draft", 1)).toBeNull();
    expect(submitScanError("filed", "returned", 2)).toBeNull();
    expect(submitScanError("approved", null, 0)).toMatch(/at least one author/);
    expect(submitScanError("approved", "draft", 0)).toMatch(/at least one author/);
    expect(submitScanError("approved", "submitted", 1)).toMatch(/only if it is returned/);
    expect(submitScanError("submitted", "draft", 1)).toMatch(/once the syllabus is approved/);
  });
});

describe("returnError", () => {
  it("returns only a submitted justification", () => {
    expect(returnError("submitted")).toBeNull();
    for (const status of [null, "draft", "returned"] as const) {
      expect(returnError(status)).toBe("Only a submitted justification can be returned.");
    }
  });
});
