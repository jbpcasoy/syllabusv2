import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  loadMyStandIns,
  loadQueueExtras,
  QUEUE_EXPAND,
  queueFilter,
  queueSort,
  queueStages,
  toQueueItems,
} from "@/lib/review-queue";
import { getUserRoles } from "@/lib/roles";
import { isQueueStatus, type ReviewQueueResponse } from "@/types/review-queue";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/review-queue?stage=2&status=waiting&program=<id>&term=<id>&search=foo&page=1&perPage=30
// Any signed-in user. One stage's queue: syllabi in the caller's scope at
// that stage (status waiting, returned or passed), never ones they author.
// `stages` lists the tabs the caller may open; stage defaults to the first.
// Admin sees every stage, read-only unless they hold it.
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status")?.trim() || "waiting";
  if (!isQueueStatus(status)) {
    return NextResponse.json(
      { error: "Status must be waiting, returned or passed." },
      { status: 400 },
    );
  }
  const stageParam = searchParams.get("stage")?.trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, Number(searchParams.get("perPage")) || 30),
  );

  try {
    const me = auth.user.id;
    const pb = await createAdminPb();
    const [roles, standIns] = await Promise.all([
      getUserRoles(me),
      loadMyStandIns(pb, me),
    ]);
    const stages = queueStages(roles, standIns.map((s) => s.stage));

    const stage = stageParam ? Number(stageParam) : (stages[0] ?? 0);
    if (stageParam && !stages.includes(stage)) {
      return NextResponse.json(
        { error: "You don't review at this stage." },
        { status: 403 },
      );
    }
    if (stages.length === 0) {
      const empty: ReviewQueueResponse = {
        page: 1,
        perPage,
        totalItems: 0,
        totalPages: 0,
        items: [],
        stages,
        stage: 0,
      };
      return NextResponse.json(empty);
    }

    // pb.filter() inside queueFilter binds every input.
    const result = await pb
      .collection("syllabi")
      .getList<Syllabus>(page, perPage, {
        sort: queueSort(status),
        expand: QUEUE_EXPAND,
        filter: queueFilter(pb, {
          stage,
          status,
          me,
          roles,
          standIns,
          program: searchParams.get("program")?.trim() || undefined,
          term: searchParams.get("term")?.trim() || undefined,
          search: searchParams.get("search")?.trim() || undefined,
        }),
      });

    const { covers, versionNos } = await loadQueueExtras(
      pb,
      result.items.map((record) => record.id),
    );
    const body: ReviewQueueResponse = {
      ...result,
      items: toQueueItems(result.items, { stage, me, roles, covers, versionNos }),
      stages,
      stage,
    };
    return NextResponse.json(body);
  } catch (error) {
    return handlePbError(error);
  }
}
