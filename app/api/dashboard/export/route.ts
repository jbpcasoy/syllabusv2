import { requireUser } from "@/lib/auth";
import { fileSlug } from "@/lib/csv";
import {
  allAwaitingSignedCopy,
  justificationRows,
  loadTermSlots,
  resolveScopedPrograms,
  termSyllabusRows,
} from "@/lib/dashboard";
import { aggregate } from "@/lib/dashboard-aggregate";
import {
  completionCsv,
  filterOverdue,
  justificationsCsv,
  signedCopiesCsv,
  syllabiCsv,
} from "@/lib/dashboard-export";
import {
  dashboardScope,
  justificationScope,
  OUT_OF_SCOPE_ERROR,
  scopeIsEmpty,
} from "@/lib/dashboard-scope";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  parseDashboardQuery,
  parseExportView,
  parseJustificationState,
  parseSyllabusExportFilters,
} from "@/lib/validators/dashboard";
import { EXPORT_ROW_LIMIT } from "@/types/dashboard";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

const cap = <T>(rows: T[]) => ({
  rows: rows.slice(0, EXPORT_ROW_LIMIT),
  truncated: rows.length > EXPORT_ROW_LIMIT,
});

// GET /api/dashboard/export?view=completion|syllabi|signed-copies|justifications&term=<id>&college=&department=&program=
//   view=syllabi also takes &status=&stage=1-5&overdue=review|submission
//   view=justifications also takes &state=none|draft|submitted|returned
// A CSV download of a dashboard panel, with the same capability, scope and
// filters as its JSON route. At most EXPORT_ROW_LIMIT rows; X-Truncated:
// true when there were more. Names only, never emails.
export async function GET(request: NextRequest) {
  const auth = await requireUser("dashboard.view");
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const view = parseExportView(searchParams.get("view"));
  if (!view.ok) return NextResponse.json({ error: view.error }, { status: 400 });
  const query = parseDashboardQuery(searchParams);
  if (!query.ok) return NextResponse.json({ error: query.error }, { status: 400 });
  const syllabusFilters = parseSyllabusExportFilters(searchParams);
  if (!syllabusFilters.ok) {
    return NextResponse.json({ error: syllabusFilters.error }, { status: 400 });
  }
  const state = parseJustificationState(searchParams.get("state"));
  if (!state.ok) return NextResponse.json({ error: state.error }, { status: 400 });
  const { term: termId, filters } = query.data;

  try {
    const roles = await getUserRoles(auth.user.id);
    const scope =
      view.data === "justifications" ? justificationScope(roles) : dashboardScope(roles);
    if (scopeIsEmpty(scope) && view.data === "justifications") {
      return NextResponse.json(
        { error: "Only reviewers and administrators see justifications." },
        { status: 403 },
      );
    }

    const pb = await createAdminPb();
    const scoped = await resolveScopedPrograms(pb, scope, filters);
    if (!scoped.ok) {
      return NextResponse.json({ error: OUT_OF_SCOPE_ERROR }, { status: 403 });
    }

    const term = await pb.collection("terms").getOne<Term>(termId, {
      expand: "school_year",
      fields:
        "id,school_year,semester,submission_deadline,review_days,expand.school_year.label",
    });
    const deadlines = {
      submission_deadline: term.submission_deadline ?? "",
      review_days: term.review_days ?? 0,
    };
    const now = new Date();

    let csv: string;
    let truncated = false;
    switch (view.data) {
      case "completion": {
        const slots = await loadTermSlots(pb, term, scoped.programs, scoped.everything);
        const capped = cap(aggregate(slots, deadlines, now).completion);
        csv = completionCsv(capped.rows);
        truncated = capped.truncated;
        break;
      }
      case "syllabi": {
        const { overdue, ...where } = syllabusFilters.data;
        const rows = filterOverdue(
          await termSyllabusRows(pb, termId, scoped, where),
          overdue,
          deadlines,
          now,
        );
        const capped = cap(rows);
        csv = syllabiCsv(capped.rows, deadlines, now);
        truncated = capped.truncated;
        break;
      }
      case "signed-copies": {
        const capped = cap(await allAwaitingSignedCopy(pb, termId, scoped));
        csv = signedCopiesCsv(capped.rows, now);
        truncated = capped.truncated;
        break;
      }
      case "justifications": {
        const capped = cap(await justificationRows(pb, termId, scoped, state.data));
        csv = justificationsCsv(capped.rows);
        truncated = capped.truncated;
        break;
      }
    }

    const termName = `${term.expand?.school_year?.label ?? ""} ${term.semester}`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${view.data}-${fileSlug(termName)}.csv"`,
        "Cache-Control": "no-store",
        "X-Truncated": String(truncated),
      },
    });
  } catch (error) {
    return handlePbError(error);
  }
}
