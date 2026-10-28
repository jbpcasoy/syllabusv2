import { describe, expect, it, vi } from "vitest";

import { addAudit } from "@/lib/audit";
import type PocketBase from "pocketbase";

const SYLLABUS_ID = "syl111111111111";
const ADMIN = "admin1111111111";

function fakeBatch() {
  const create = vi.fn();
  const collection = vi.fn(() => ({ create }));
  const batch = { collection } as unknown as ReturnType<
    PocketBase["createBatch"]
  >;
  return { batch, collection, create };
}

describe("addAudit", () => {
  it("queues one audit_log create with every field", () => {
    const { batch, collection, create } = fakeBatch();

    addAudit(batch, {
      actor: ADMIN,
      action: "lead.transferred",
      target_collection: "syllabi",
      target_id: SYLLABUS_ID,
      syllabus: SYLLABUS_ID,
      override: true,
      reason: "The chair is on leave.",
      data: { from_lead: "lead11111111111", to_lead: "lead22222222222" },
    });

    expect(collection).toHaveBeenCalledExactlyOnceWith("audit_log");
    expect(create).toHaveBeenCalledExactlyOnceWith({
      actor: ADMIN,
      action: "lead.transferred",
      target_collection: "syllabi",
      target_id: SYLLABUS_ID,
      syllabus: SYLLABUS_ID,
      override: true,
      reason: "The chair is on leave.",
      data: { from_lead: "lead11111111111", to_lead: "lead22222222222" },
    });
  });

  it("defaults the optional fields", () => {
    const { batch, create } = fakeBatch();

    addAudit(batch, {
      actor: ADMIN,
      action: "file.uploaded",
      target_collection: "syllabus_versions",
      target_id: "ver111111111111",
    });

    expect(create).toHaveBeenCalledExactlyOnceWith({
      actor: ADMIN,
      action: "file.uploaded",
      target_collection: "syllabus_versions",
      target_id: "ver111111111111",
      syllabus: "",
      override: false,
      reason: "",
      data: null,
    });
  });
});
