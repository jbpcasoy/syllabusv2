import { describe, expect, it, vi } from "vitest";

import {
  addNotifications,
  notificationRecipients,
  notificationText,
  stageActors,
  type NotificationFacts,
  type NotifyEvent,
} from "@/lib/notifications";
import type { ChainHolders, StandIn } from "@/lib/syllabus-review";
import type PocketBase from "pocketbase";

const LEAD = "leadleadleadlea";
const CO = "cococococococoa";
const SYLLABUS = { lead: LEAD, co_authors: [CO] };
const SYLLABUS_ID = "sylsylsylsylsyl";

// One holder per stage, plus a second dean.
const HOLDERS: ChainHolders = [
  ["reviewer1111111"],
  ["dean11111111111", "dean22222222222"],
  ["fdis11111111111"],
  ["citl11111111111"],
  ["vpaa11111111111"],
];
const STRANGER = "strangerstrange";

const FACTS: NotificationFacts = {
  courseCode: "IT 101",
  courseTitle: "Intro to Computing",
  programCode: "BSIT",
  actorName: "Ana Cruz",
};

const event = (
  type: NotifyEvent["type"],
  stage: number,
  actor = STRANGER,
): NotifyEvent => ({ type, stage, actor });

describe("stageActors", () => {
  it("returns the holders of the stage", () => {
    expect(stageActors(2, SYLLABUS, HOLDERS, [])).toEqual([
      "dean11111111111",
      "dean22222222222",
    ]);
  });

  it("returns only the stand-in when one is set", () => {
    const standIns: StandIn[] = [{ stage: 2, user: "standinstandins" }];
    expect(stageActors(2, SYLLABUS, HOLDERS, standIns)).toEqual([
      "standinstandins",
    ]);
  });

  it("returns the proxy at stage 1", () => {
    const standIns: StandIn[] = [{ stage: 1, user: "proxyproxyproxy" }];
    expect(stageActors(1, SYLLABUS, HOLDERS, standIns)).toEqual([
      "proxyproxyproxy",
    ]);
  });

  it("ignores a stand-in for another stage", () => {
    const standIns: StandIn[] = [{ stage: 3, user: "standinstandins" }];
    expect(stageActors(1, SYLLABUS, HOLDERS, standIns)).toEqual([
      "reviewer1111111",
    ]);
  });

  it("never returns an author", () => {
    const holders: ChainHolders = [[LEAD, CO, "reviewer1111111"]];
    expect(stageActors(1, SYLLABUS, holders, [])).toEqual(["reviewer1111111"]);
  });

  it("returns nobody for a stage with no holder", () => {
    expect(stageActors(1, SYLLABUS, [], [])).toEqual([]);
  });
});

describe("notificationRecipients", () => {
  describe.each(["submitted", "resubmitted"] as const)("%s", (type) => {
    it.each([1, 2, 3, 4, 5])(
      "asks the actors at stage %i to review",
      (stage) => {
        const targets = notificationRecipients(
          event(type, stage, LEAD),
          SYLLABUS,
          HOLDERS,
          [],
        );
        expect(targets).toEqual(
          HOLDERS[stage - 1].map((user) => ({
            user,
            kind: "review_requested",
            stage,
          })),
        );
      },
    );

    it("asks the stand-in instead of the holders", () => {
      const standIns: StandIn[] = [{ stage: 2, user: "standinstandins" }];
      expect(
        notificationRecipients(event(type, 2, LEAD), SYLLABUS, HOLDERS, standIns),
      ).toEqual([
        { user: "standinstandins", kind: "review_requested", stage: 2 },
      ]);
    });

    it("never asks an author to review", () => {
      const holders: ChainHolders = [[CO]];
      expect(
        notificationRecipients(event(type, 1, LEAD), SYLLABUS, holders, []),
      ).toEqual([]);
    });
  });

  it.each([1, 2, 3, 4])(
    "on approval at stage %i asks the next stage and tells the lead",
    (stage) => {
      const actor = HOLDERS[stage - 1][0];
      const targets = notificationRecipients(
        event("approved", stage, actor),
        SYLLABUS,
        HOLDERS,
        [],
      );
      expect(targets).toEqual([
        ...HOLDERS[stage].map((user) => ({
          user,
          kind: "review_requested",
          stage: stage + 1,
        })),
        { user: LEAD, kind: "approved", stage },
      ]);
    },
  );

  it("on approval asks the next stage's stand-in", () => {
    const standIns: StandIn[] = [{ stage: 3, user: "standinstandins" }];
    expect(
      notificationRecipients(event("approved", 2), SYLLABUS, HOLDERS, standIns),
    ).toEqual([
      { user: "standinstandins", kind: "review_requested", stage: 3 },
      { user: LEAD, kind: "approved", stage: 2 },
    ]);
  });

  it("on final approval tells the lead and co-authors", () => {
    const targets = notificationRecipients(
      event("approved", 5, "vpaa11111111111"),
      { lead: LEAD, co_authors: [CO, "co2co2co2co2co2"] },
      HOLDERS,
      [],
    );
    expect(targets).toEqual([
      { user: LEAD, kind: "final_approved", stage: 5 },
      { user: CO, kind: "final_approved", stage: 5 },
      { user: "co2co2co2co2co2", kind: "final_approved", stage: 5 },
    ]);
  });

  it.each([1, 2, 3, 4, 5])(
    "on return at stage %i tells the lead and co-authors",
    (stage) => {
      expect(
        notificationRecipients(
          event("returned", stage, HOLDERS[stage - 1][0]),
          SYLLABUS,
          HOLDERS,
          [],
        ),
      ).toEqual([
        { user: LEAD, kind: "returned", stage },
        { user: CO, kind: "returned", stage },
      ]);
    },
  );

  it("on return with no co-authors tells only the lead", () => {
    expect(
      notificationRecipients(
        event("returned", 2),
        { lead: LEAD, co_authors: [] },
        HOLDERS,
        [],
      ),
    ).toEqual([{ user: LEAD, kind: "returned", stage: 2 }]);
  });

  it("never notifies the actor", () => {
    // The dean who approved stage 2 also holds stage 3.
    const holders: ChainHolders = [
      ["reviewer1111111"],
      ["dean11111111111"],
      ["dean11111111111", "fdis11111111111"],
    ];
    expect(
      notificationRecipients(
        event("approved", 2, "dean11111111111"),
        SYLLABUS,
        holders,
        [],
      ),
    ).toEqual([
      { user: "fdis11111111111", kind: "review_requested", stage: 3 },
      { user: LEAD, kind: "approved", stage: 2 },
    ]);
  });

  it("lists each user once", () => {
    const holders: ChainHolders = [["reviewer1111111", "reviewer1111111"]];
    expect(
      notificationRecipients(event("submitted", 1, LEAD), SYLLABUS, holders, []),
    ).toEqual([{ user: "reviewer1111111", kind: "review_requested", stage: 1 }]);
  });

  it("skips a co-author listed twice", () => {
    expect(
      notificationRecipients(
        event("returned", 1),
        { lead: LEAD, co_authors: [CO, CO] },
        HOLDERS,
        [],
      ),
    ).toEqual([
      { user: LEAD, kind: "returned", stage: 1 },
      { user: CO, kind: "returned", stage: 1 },
    ]);
  });
});

describe("notificationText", () => {
  it("asks for review with a link to the review workspace", () => {
    expect(notificationText("review_requested", 2, SYLLABUS_ID, FACTS)).toEqual({
      title: "IT 101 (BSIT) is waiting for your review",
      body: "IT 101 Intro to Computing (BSIT) is waiting for your review as Dean. Last action by Ana Cruz.",
      link: `/syllabus/${SYLLABUS_ID}/review`,
    });
  });

  it("reports an approval and the next stage, linking to the hub", () => {
    expect(notificationText("approved", 1, SYLLABUS_ID, FACTS)).toEqual({
      title: "IT 101 (BSIT) was approved by the Program Reviewer",
      body: "Ana Cruz approved IT 101 Intro to Computing (BSIT) as Program Reviewer. It now waits on the Dean.",
      link: `/syllabus/${SYLLABUS_ID}`,
    });
  });

  it("asks for the signed copy on final approval", () => {
    const text = notificationText("final_approved", 5, SYLLABUS_ID, FACTS);
    expect(text.title).toBe("IT 101 (BSIT) is fully approved");
    expect(text.body).toContain("Upload the wet-signed scan");
    expect(text.link).toBe(`/syllabus/${SYLLABUS_ID}`);
  });

  it("reports a return with a link to the revise workspace", () => {
    expect(notificationText("returned", 4, SYLLABUS_ID, FACTS)).toEqual({
      title: "IT 101 (BSIT) was returned for revision",
      body: "Ana Cruz returned IT 101 Intro to Computing (BSIT) as CITL Director. Respond to each review point, upload a revised version, then resubmit.",
      link: `/syllabus/${SYLLABUS_ID}/revise`,
    });
  });

  it("clips the title and body to the field limits", () => {
    const long = { ...FACTS, courseCode: "X".repeat(300), courseTitle: "Y".repeat(1200) };
    const text = notificationText("returned", 1, SYLLABUS_ID, long);
    expect(text.title).toHaveLength(200);
    expect(text.title.endsWith("…")).toBe(true);
    expect(text.body).toHaveLength(1000);
  });
});

describe("addNotifications", () => {
  it("queues one pending create per target on the batch", () => {
    const create = vi.fn();
    const collection = vi.fn(() => ({ create }));
    const batch = { collection } as unknown as ReturnType<
      PocketBase["createBatch"]
    >;

    addNotifications(
      batch,
      SYLLABUS_ID,
      "dean11111111111",
      [
        { user: "fdis11111111111", kind: "review_requested", stage: 3 },
        { user: LEAD, kind: "approved", stage: 2 },
      ],
      FACTS,
    );

    expect(collection).toHaveBeenCalledWith("notifications");
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(1, {
      user: "fdis11111111111",
      syllabus: SYLLABUS_ID,
      kind: "review_requested",
      stage: 3,
      actor: "dean11111111111",
      ...notificationText("review_requested", 3, SYLLABUS_ID, FACTS),
      email_status: "pending",
      email_attempts: 0,
    });
    expect(create.mock.calls[1][0]).toMatchObject({
      user: LEAD,
      kind: "approved",
      stage: 2,
      link: `/syllabus/${SYLLABUS_ID}`,
    });
  });

  it("queues nothing with no targets", () => {
    const collection = vi.fn();
    const batch = { collection } as unknown as ReturnType<
      PocketBase["createBatch"]
    >;
    addNotifications(batch, SYLLABUS_ID, LEAD, [], FACTS);
    expect(collection).not.toHaveBeenCalled();
  });
});
