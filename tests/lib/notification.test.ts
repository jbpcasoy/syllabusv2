import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  countUnread,
  markAllRead,
  ownFilter,
  toNotificationResponse,
} from "@/lib/notification";
import type { Notification } from "@/types/notification";
import type PocketBase from "pocketbase";

const ME = "me1me1me1me1me1";
const NOW = "2026-10-28T08:00:00.000Z";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

const record = {
  id: "ntfntfntfntfntf",
  collectionId: "pbc_1800000017",
  collectionName: "notifications",
  user: ME,
  syllabus: "sylsylsylsylsyl",
  kind: "returned",
  stage: 2,
  actor: "deandeandeandea",
  title: "IT 101 (BSIT) was returned for revision",
  body: "Body",
  link: "/syllabus/sylsylsylsylsyl/revise",
  read_at: "",
  email_status: "failed",
  email_attempts: 3,
  email_error: "smtp: connection refused",
  emailed_at: "",
  created: "2026-10-28 07:00:00.000Z",
  updated: "2026-10-28 07:00:00.000Z",
  expand: {
    actor: { id: "deandeandeandea", name: "Dean Reyes", email: "dean@buksu.edu.ph" },
  },
} as unknown as Notification;

describe("toNotificationResponse", () => {
  it("maps the safe fields and never the email outbox or emails", () => {
    const response = toNotificationResponse(record);
    expect(response).toEqual({
      id: "ntfntfntfntfntf",
      syllabus: "sylsylsylsylsyl",
      kind: "returned",
      stage: 2,
      title: "IT 101 (BSIT) was returned for revision",
      body: "Body",
      link: "/syllabus/sylsylsylsylsyl/revise",
      read: false,
      actor_name: "Dean Reyes",
      created: "2026-10-28 07:00:00.000Z",
    });
    expect(JSON.stringify(response)).not.toMatch(/email|smtp|@buksu/);
  });

  it("reads a stamped read_at as read, and a missing actor as no name", () => {
    expect(
      toNotificationResponse({ ...record, read_at: NOW, expand: undefined }),
    ).toMatchObject({ read: true, actor_name: "" });
  });
});

describe("ownFilter", () => {
  const pb = { filter } as unknown as PocketBase;

  it("limits to the user's rows", () => {
    expect(ownFilter(pb, ME)).toBe(`user = "${ME}"`);
  });

  it("limits to the user's unread rows", () => {
    expect(ownFilter(pb, ME, true)).toBe(`user = "${ME}" && read_at = ''`);
  });
});

describe("countUnread", () => {
  it("counts the user's unread rows without loading them", async () => {
    const getList = vi.fn(async () => ({ totalItems: 4 }));
    const pb = {
      filter,
      collection: vi.fn(() => ({ getList })),
    } as unknown as PocketBase;

    expect(await countUnread(pb, ME)).toBe(4);
    expect(getList).toHaveBeenCalledWith(1, 1, {
      fields: "id",
      filter: `user = "${ME}" && read_at = ''`,
    });
  });
});

describe("markAllRead", () => {
  function fakePb(unreadCount: number) {
    const batches: unknown[][] = [];
    const getFullList = vi.fn(async () =>
      Array.from({ length: unreadCount }, (_, i) => ({ id: `n${i}` })),
    );
    const pb = {
      filter,
      collection: vi.fn(() => ({ getFullList })),
      createBatch: vi.fn(() => {
        const ops: unknown[] = [];
        batches.push(ops);
        return {
          collection: (name: string) => ({
            update: (id: string, body: unknown) =>
              ops.push(["update", name, id, body]),
          }),
          send: vi.fn(async () => []),
        };
      }),
    } as unknown as PocketBase;
    return { pb, batches, getFullList };
  }

  it("stamps each unread row of the user", async () => {
    const { pb, batches, getFullList } = fakePb(2);
    await markAllRead(pb, ME, NOW);

    expect(getFullList).toHaveBeenCalledWith({
      fields: "id",
      filter: `user = "${ME}" && read_at = ''`,
    });
    expect(batches).toEqual([
      [
        ["update", "notifications", "n0", { read_at: NOW }],
        ["update", "notifications", "n1", { read_at: NOW }],
      ],
    ]);
  });

  it("splits into batches of 50", async () => {
    const { pb, batches } = fakePb(120);
    await markAllRead(pb, ME, NOW);
    expect(batches.map((b) => b.length)).toEqual([50, 50, 20]);
  });

  it("sends nothing when everything is read", async () => {
    const { pb, batches } = fakePb(0);
    await markAllRead(pb, ME, NOW);
    expect(batches).toEqual([]);
  });
});
