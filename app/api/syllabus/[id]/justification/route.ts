import { authorize, requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import {
  canViewJustification,
  findJustification,
  loadJustificationResponse,
} from "@/lib/justification";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { hasNotUniqueError } from "@/lib/syllabus-decision";
import { editError, returnError } from "@/lib/syllabus-justification";
import {
  parseJustificationInput,
  parseJustificationReturn,
} from "@/lib/validators/justification";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 });

/** The syllabus and the caller's access; null when they may not see it. */
async function load(id: string, userId: string) {
  const pb = await createAdminPb();
  const [syllabus, roles] = await Promise.all([
    pb.collection("syllabi").getOne<Syllabus>(id),
    getUserRoles(userId),
  ]);
  const access = await resolveSyllabusAccess(pb, userId, roles, syllabus);
  return access && canViewJustification(access) ? { pb, syllabus, access } : null;
}

// GET /api/syllabus/:id/justification
// Lead, co-authors, reviewers and admin (never referencers). Fills based_on
// when it's missing, then reports who may be named and the justification.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const loaded = await load(id, auth.user.id);
    if (!loaded) return notFound();
    const canReturn = await can(auth.user, "justification.return", {
      program: loaded.syllabus.program,
    });
    return NextResponse.json(
      await loadJustificationResponse(loaded.pb, loaded.syllabus, {
        access: loaded.access,
        canReturn,
      }),
    );
  } catch (error) {
    return handlePbError(error);
  }
}

// PUT /api/syllabus/:id/justification  { "entries": [{ "author": "<userId>", "reason": "" }] }
// Lead only, once the syllabus is approved, while not submitted. Each author
// must be an author of last school year's syllabus who isn't a current
// author. An empty list deletes the justification.
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseJustificationInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const loaded = await load(id, auth.user.id);
    if (!loaded) return notFound();
    const { pb, syllabus, access } = loaded;
    if (access !== "lead") {
      return NextResponse.json(
        { error: "Only the lead can write the justification." },
        { status: 403 },
      );
    }

    const [response, record] = await Promise.all([
      loadJustificationResponse(pb, syllabus, { access, canReturn: false }),
      findJustification(pb, id),
    ]);
    if (!response.applies) {
      return conflict("There is no syllabus from last school year to acknowledge.");
    }
    const ruleError = editError(syllabus.status, record?.status ?? null);
    if (ruleError) return conflict(ruleError);

    const allowed = new Set(response.eligible_authors.map((a) => a.id));
    const stray = parsed.data.entries.find((e) => !allowed.has(e.author));
    if (stray) {
      return conflict(
        "Each author must be an author of last school year's syllabus who isn't an author of this one.",
      );
    }

    const { entries } = parsed.data;
    try {
      if (entries.length === 0) {
        if (record) {
          await pb.collection("syllabus_justifications").delete(record.id);
        }
      } else if (record) {
        await pb.collection("syllabus_justifications").update(record.id, { entries });
      } else {
        await pb
          .collection("syllabus_justifications")
          .create({ syllabus: id, entries, status: "draft" });
      }
    } catch (error) {
      // UNIQUE (syllabus) rejects a concurrent first save.
      if (hasNotUniqueError(error)) {
        return conflict("Another save finished first. Please try again.");
      }
      throw error;
    }

    return NextResponse.json(
      await loadJustificationResponse(pb, syllabus, { access, canReturn: false }),
    );
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/syllabus/:id/justification  { "action": "return", "reason": "" }
// justification.return in the syllabus's program: its program reviewer or
// any higher role in the chain, or admin. submitted -> returned.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseJustificationReturn(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const loaded = await load(id, auth.user.id);
    if (!loaded) return notFound();
    const { pb, syllabus, access } = loaded;
    const denied = await authorize(auth.user, "justification.return", {
      program: syllabus.program,
    });
    if (denied) return denied;

    const record = await findJustification(pb, id);
    const ruleError = returnError(record?.status ?? null);
    if (ruleError || !record) return conflict(ruleError ?? "");

    await pb.collection("syllabus_justifications").update(record.id, {
      status: "returned",
      return_reason: parsed.data.reason,
      returned_by: auth.user.id,
      returned_at: new Date().toISOString(),
    });
    return NextResponse.json(
      await loadJustificationResponse(pb, syllabus, { access, canReturn: true }),
    );
  } catch (error) {
    return handlePbError(error);
  }
}
