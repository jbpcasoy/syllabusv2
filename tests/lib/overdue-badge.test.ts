import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  reviewOverdueDays,
  submissionOverdueDays,
} from "@/components/syllabus/overdue-badge";

// The badges' day counts, read from the term summary every row carries.
const term = { submission_deadline: "2026-12-01", review_days: 3 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-12-03T16:00:00.000Z")); // 00:00 PHT, 4 Dec
});
afterEach(() => {
  vi.useRealTimers();
});

describe("submissionOverdueDays", () => {
  it("counts whole days past the deadline for a draft", () => {
    expect(
      submissionOverdueDays(term, { syllabusStatus: "draft", hasReference: false }),
    ).toBe(2);
  });

  it("counts an empty slot", () => {
    expect(
      submissionOverdueDays(term, { syllabusStatus: null, hasReference: false }),
    ).toBe(2);
  });

  it("is 0 once submitted, with a reference, or without the term", () => {
    expect(
      submissionOverdueDays(term, { syllabusStatus: "submitted", hasReference: false }),
    ).toBe(0);
    expect(
      submissionOverdueDays(term, { syllabusStatus: null, hasReference: true }),
    ).toBe(0);
    expect(
      submissionOverdueDays(undefined, { syllabusStatus: null, hasReference: false }),
    ).toBe(0);
  });
});

describe("reviewOverdueDays", () => {
  it("counts days past the limit while submitted", () => {
    // Waiting since 29 Nov 16:00Z: due 2 Dec 16:00Z, one day late now.
    expect(
      reviewOverdueDays(
        { status: "submitted", status_changed_at: "2026-11-29 16:00:00.000Z" },
        term,
      ),
    ).toBe(1);
  });

  it("is 0 within the limit, when not submitted, or without the term", () => {
    const recent = { status: "submitted" as const, status_changed_at: "2026-12-02 16:00:00.000Z" };
    expect(reviewOverdueDays(recent, term)).toBe(0);
    expect(
      reviewOverdueDays({ ...recent, status: "returned", status_changed_at: "2026-01-01 00:00:00.000Z" }, term),
    ).toBe(0);
    expect(reviewOverdueDays(recent, undefined)).toBe(0);
  });
});
