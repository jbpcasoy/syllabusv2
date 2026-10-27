import { CURRENT_FORM18 } from "@/lib/forms";
import type {
  Form18Point,
  Form18PointResponse,
  Form18Response,
} from "@/types/form18";
import type { AppUser } from "@/types/user";
import type PocketBase from "pocketbase";
import "server-only";

export const POINT_EXPAND = "raised_by,responded_by,judged_by";

const person = (id: string, user?: AppUser) =>
  id ? { id, name: user?.name ?? "" } : null;

export function toPointResponse(point: Form18Point): Form18PointResponse {
  return {
    id: point.id,
    version: point.version,
    part: point.part,
    stage: point.stage,
    code: point.code,
    review_point: point.review_point,
    action_taken: point.action_taken,
    page_number: point.page_number,
    remarks: point.remarks,
    status: point.status,
    raised_by: { id: point.raised_by, name: point.expand?.raised_by?.name ?? "" },
    responded_by: person(point.responded_by, point.expand?.responded_by),
    judged_by: person(point.judged_by, point.expand?.judged_by),
    created: point.created,
    updated: point.updated,
  };
}

/** Every point of the syllabus, by stage then age. */
export async function listPoints(
  pb: PocketBase,
  syllabusId: string,
): Promise<Form18Point[]> {
  return pb.collection("form18_points").getFullList<Form18Point>({
    expand: POINT_EXPAND,
    sort: "stage,created",
    filter: pb.filter("syllabus = {:syllabusId}", { syllabusId }),
  });
}

export async function loadForm18(
  pb: PocketBase,
  syllabusId: string,
): Promise<Form18Response> {
  const points = await listPoints(pb, syllabusId);
  return {
    form_revision: points[0]?.form_revision ?? CURRENT_FORM18.revision,
    points: points.map(toPointResponse),
  };
}
