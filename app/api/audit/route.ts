import { listAudit } from "@/lib/audit-log";
import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseAuditQuery } from "@/lib/validators/audit";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/audit?action=&actor=<id>&syllabus=<id>&override=true|false&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&perPage=30
// audit.view (admin). Status changes, lead transfers and uploads, newest
// first, with names but never emails. Read-only: no route writes audit_log
// except through the change it records.
export async function GET(request: NextRequest) {
  const auth = await requireUser("audit.view");
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const parsed = parseAuditQuery(searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, Number(searchParams.get("perPage")) || 30),
  );

  try {
    const pb = await createAdminPb();
    return NextResponse.json(await listAudit(pb, parsed.data, page, perPage));
  } catch (error) {
    return handlePbError(error);
  }
}
