import { requireUser } from "@/lib/auth";
import {
  addNotifications,
  notificationFacts,
  NOTIFY_EXPAND,
} from "@/lib/notifications";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { activeFacultyAmong, resolveSyllabusAccess } from "@/lib/syllabus";
import { loadChainHolders } from "@/lib/syllabus-chain";
import { hasNotUniqueError } from "@/lib/syllabus-decision";
import {
  canDesignate,
  isAuthor,
  standInWindowError,
} from "@/lib/syllabus-review";
import { listStandIns } from "@/lib/syllabus-stand-in";
import { parseStandInInput } from "@/lib/validators/syllabus-stand-in";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusStandIn } from "@/types/syllabus-stand-in";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 });

// GET /api/syllabus/:id/stand-in
// Anyone with access to the syllabus, plus anyone who may name its proxy
// (they need to see it while the syllabus is still a draft).
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(me),
    ]);
    const holders = await loadChainHolders(pb, syllabus.program);
    if (
      !canDesignate(me, roles.isAdmin, 1, holders) &&
      !(await resolveSyllabusAccess(pb, me, roles, syllabus))
    ) {
      return notFound();
    }

    return NextResponse.json({ items: await listStandIns(pb, id) });
  } catch (error) {
    return handlePbError(error);
  }
}

// PUT /api/syllabus/:id/stand-in  { "stage": 1-5, "user": "<userId>" | null }
// An admin or an active holder of a later stage; the program reviewer also
// names their own proxy. Sets or clears the stage and returns every stand-in.
// A new stand-in for the stage waiting now is told it waits for their review.
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseStandInInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { stage, user } = parsed.data;

    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id, { expand: NOTIFY_EXPAND }),
      getUserRoles(me),
    ]);
    const holders = await loadChainHolders(pb, syllabus.program);
    if (!canDesignate(me, roles.isAdmin, stage, holders)) {
      if (!(await resolveSyllabusAccess(pb, me, roles, syllabus))) {
        return notFound();
      }
      return NextResponse.json(
        {
          error:
            "Only an admin or a reviewer of a later stage can designate a stand-in for this stage.",
        },
        { status: 403 },
      );
    }

    const windowError = standInWindowError(syllabus, stage);
    if (windowError) return conflict(windowError);

    const existing = await pb
      .collection("syllabus_stand_ins")
      .getList<SyllabusStandIn>(1, 1, {
        skipTotal: true,
        filter: pb.filter("syllabus = {:id} && stage = {:stage}", { id, stage }),
      });
    const current = existing.items[0];

    if (user === null) {
      if (current) {
        await pb.collection("syllabus_stand_ins").delete(current.id);
      }
      return NextResponse.json({ items: await listStandIns(pb, id) });
    }

    if (isAuthor(user, syllabus)) {
      return conflict("A stand-in can't lead or co-author this syllabus.");
    }
    if (
      stage === 1 &&
      !(await activeFacultyAmong(pb, syllabus.program, [user])).has(user)
    ) {
      return conflict("A proxy must be active faculty of the program.");
    }

    const data = { user, assigned_by: me };
    const batch = pb.createBatch();
    const standIns = batch.collection("syllabus_stand_ins");
    if (current) {
      standIns.update(current.id, data);
    } else {
      standIns.create({ syllabus: id, stage, ...data });
    }
    // Their stage is waiting now, so they hear about it in the same batch.
    // Nobody is told twice for the same appointment, or about their own.
    const waiting = syllabus.status === "submitted" && syllabus.stage === stage;
    if (waiting && user !== me && current?.user !== user) {
      addNotifications(
        batch,
        id,
        me,
        [{ user, kind: "review_requested", stage }],
        notificationFacts(syllabus, auth.user.name),
      );
    }
    try {
      await batch.send();
    } catch (error) {
      // The unique index (syllabus, stage) rejects a concurrent create.
      if (hasNotUniqueError(error)) {
        return conflict("Another change finished first. Please try again.");
      }
      throw error;
    }

    return NextResponse.json({ items: await listStandIns(pb, id) });
  } catch (error) {
    return handlePbError(error);
  }
}
