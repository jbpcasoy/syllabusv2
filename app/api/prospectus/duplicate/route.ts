import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { PROSPECTUS_EXPAND, toProspectusResponse } from "@/lib/prospectus";
import {
  applyDuplicate,
  batchSize,
  MAX_BATCH_REQUESTS,
  planDuplicate,
  toProspectusDuplicateResponse,
} from "@/lib/prospectus-duplicate";
import { parseProspectusDuplicateInput } from "@/lib/validators/prospectus-duplicate";
import type { Prospectus } from "@/types/prospectus";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/prospectus/duplicate?program=<id>&source_school_year=<id>&target_school_year=<id>
// Preview only: lists what would be copied and what is skipped as already present.
export async function GET(request: NextRequest) {
  const auth = await requireUser("prospectus.write");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const parsed = parseProspectusDuplicateInput({
      program: searchParams.get("program")?.trim(),
      source_school_year: searchParams.get("source_school_year")?.trim(),
      target_school_year: searchParams.get("target_school_year")?.trim(),
    });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const plan = await planDuplicate(pb, parsed.data);

    return NextResponse.json(toProspectusDuplicateResponse(plan));
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/prospectus/duplicate  { "program": "<id>", "source_school_year": "<id>", "target_school_year": "<id>" }
// Re-plans on the server, then writes everything in one atomic batch.
// 201 when the target prospectus was created, 200 when items were added to an existing one.
export async function POST(request: NextRequest) {
  const auth = await requireUser("prospectus.write");
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProspectusDuplicateInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const plan = await planDuplicate(pb, parsed.data);

    if (plan.target && plan.copy.length === 0) {
      return NextResponse.json(
        {
          error: `Nothing to copy: the ${plan.targetSchoolYear.label} prospectus already lists every course`,
        },
        { status: 409 },
      );
    }
    if (batchSize(plan) > MAX_BATCH_REQUESTS) {
      return NextResponse.json(
        {
          error: `Too many items to copy at once (at most ${MAX_BATCH_REQUESTS - 1})`,
        },
        { status: 400 },
      );
    }

    const targetId = await applyDuplicate(pb, plan);
    const prospectus = await pb
      .collection("prospectuses")
      .getOne<Prospectus>(targetId, { expand: PROSPECTUS_EXPAND });

    return NextResponse.json(
      {
        prospectus: toProspectusResponse(prospectus),
        ...toProspectusDuplicateResponse(plan),
      },
      { status: plan.target ? 200 : 201 },
    );
  } catch (error) {
    return handlePbError(error);
  }
}
