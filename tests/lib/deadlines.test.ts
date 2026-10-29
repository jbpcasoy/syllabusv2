import {
  daysOverdue,
  deadlineEnd,
  isReviewOverdue,
  isSubmissionOverdue,
  reviewDueAt,
  type SlotState,
} from "@/lib/deadlines";
import { SYLLABUS_STATUSES } from "@/lib/syllabus-workflow";
import { describe, expect, it } from "vitest";

const at = (iso: string) => new Date(iso);

describe("deadlineEnd", () => {
  it("ends the day at midnight Philippine time (16:00 UTC)", () => {
    expect(deadlineEnd("2026-12-01")?.toISOString()).toBe(
      "2026-12-01T16:00:00.000Z",
    );
  });

  it("reads only the day of a PocketBase datetime", () => {
    expect(deadlineEnd("2026-12-01 00:00:00.000Z")?.toISOString()).toBe(
      "2026-12-01T16:00:00.000Z",
    );
  });

  it("rolls over month and year ends", () => {
    expect(deadlineEnd("2026-12-31")?.toISOString()).toBe(
      "2026-12-31T16:00:00.000Z",
    );
    expect(deadlineEnd("2028-02-29")?.toISOString()).toBe(
      "2028-02-29T16:00:00.000Z",
    );
  });

  it.each(["", null, undefined, "12/01/2026", "soon"])(
    "is null for %o",
    (value) => {
      expect(deadlineEnd(value)).toBeNull();
    },
  );
});

describe("daysOverdue", () => {
  const due = at("2026-12-01T16:00:00.000Z");

  it.each([
    ["one millisecond early", "2026-12-01T15:59:59.999Z", 0],
    ["exactly at the due time", "2026-12-01T16:00:00.000Z", 1],
    ["an hour late", "2026-12-01T17:00:00.000Z", 1],
    ["exactly one day late", "2026-12-02T16:00:00.000Z", 1],
    ["a day and a minute late", "2026-12-02T16:01:00.000Z", 1],
    ["a minute short of two days", "2026-12-03T15:59:00.000Z", 1],
    ["exactly two days late", "2026-12-03T16:00:00.000Z", 2],
    ["ten days late", "2026-12-11T16:00:00.000Z", 10],
  ])("%s (%s) gives %i", (_label, now, days) => {
    expect(daysOverdue(due, at(now))).toBe(days);
  });

  it("is 0 with no due date", () => {
    expect(daysOverdue(null, at("2030-01-01T00:00:00Z"))).toBe(0);
  });
});

describe("isSubmissionOverdue", () => {
  const term = { submission_deadline: "2026-12-01 00:00:00.000Z" };
  const before = at("2026-12-01T15:59:59.999Z"); // 23:59:59 PHT on the day
  const after = at("2026-12-01T16:00:00.000Z"); // 00:00 PHT the next day
  const empty: SlotState = { syllabusStatus: null, referenceStatus: null };

  it("is on time until the end of the deadline day in PHT", () => {
    expect(isSubmissionOverdue(term, empty, before)).toBe(false);
  });

  it("is overdue from 00:00 PHT the next day when nothing exists", () => {
    expect(isSubmissionOverdue(term, empty, after)).toBe(true);
  });

  it("is overdue when only a draft exists", () => {
    expect(
      isSubmissionOverdue(term, { syllabusStatus: "draft", referenceStatus: null }, after),
    ).toBe(true);
  });

  it.each(SYLLABUS_STATUSES.filter((s) => s !== "draft"))(
    "is not overdue once the syllabus is %s",
    (status) => {
      expect(
        isSubmissionOverdue(term, { syllabusStatus: status, referenceStatus: null }, after),
      ).toBe(false);
    },
  );

  it("is overdue when the referenced syllabus is only a draft", () => {
    expect(
      isSubmissionOverdue(term, { syllabusStatus: null, referenceStatus: "draft" }, after),
    ).toBe(true);
  });

  it.each(SYLLABUS_STATUSES.filter((s) => s !== "draft"))(
    "is not overdue once the referenced syllabus is %s",
    (status) => {
      expect(
        isSubmissionOverdue(term, { syllabusStatus: null, referenceStatus: status }, after),
      ).toBe(false);
    },
  );

  it("is never overdue without a deadline", () => {
    expect(
      isSubmissionOverdue({ submission_deadline: "" }, empty, at("2099-01-01T00:00:00Z")),
    ).toBe(false);
  });
});

describe("reviewDueAt", () => {
  it("adds the limit to the time the syllabus started waiting", () => {
    expect(reviewDueAt("2026-10-20 08:00:00.000Z", 3)?.toISOString()).toBe(
      "2026-10-23T08:00:00.000Z",
    );
  });

  it.each([
    ["no limit", "2026-10-20 08:00:00.000Z", 0],
    ["a negative limit", "2026-10-20 08:00:00.000Z", -1],
    ["no start time", "", 3],
    ["an unknown start time", undefined, 3],
    ["a malformed start time", "yesterday", 3],
  ])("is null with %s", (_label, since, days) => {
    expect(reviewDueAt(since, days)).toBeNull();
  });
});

describe("isReviewOverdue", () => {
  const term = { review_days: 3 };
  const waiting = {
    status: "submitted" as const,
    status_changed_at: "2026-10-20 08:00:00.000Z",
  };

  it("is on time within the limit", () => {
    expect(isReviewOverdue(waiting, term, at("2026-10-23T07:59:59.999Z"))).toBe(false);
  });

  it("is overdue past the limit, by whole days rounded up", () => {
    const now = at("2026-10-24T08:00:00.000Z"); // waited 4 days on a 3-day limit
    expect(isReviewOverdue(waiting, term, now)).toBe(true);
    expect(daysOverdue(reviewDueAt(waiting.status_changed_at, 3), now)).toBe(1);
  });

  it("is never overdue with no limit", () => {
    expect(
      isReviewOverdue(waiting, { review_days: 0 }, at("2099-01-01T00:00:00Z")),
    ).toBe(false);
  });

  it.each(SYLLABUS_STATUSES.filter((s) => s !== "submitted"))(
    "is never overdue while %s",
    (status) => {
      expect(
        isReviewOverdue({ ...waiting, status }, term, at("2099-01-01T00:00:00Z")),
      ).toBe(false);
    },
  );

  it("is not overdue without a start time", () => {
    expect(
      isReviewOverdue({ status: "submitted" }, term, at("2099-01-01T00:00:00Z")),
    ).toBe(false);
  });
});
