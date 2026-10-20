import type { UserRole } from "@/types/user";

type Rule = { write: readonly UserRole[]; read: readonly UserRole[] };

export const PERMISSIONS = {
  campus: { read: [], write: [] },
  college: { read: [], write: ["vpaa"] },
  // The VPAA appoints deans for colleges.
  dean: { read: [], write: ["vpaa"] },
  department: { read: [], write: ["vpaa", "dean", "departmenthead"] },
  departmentHead: { read: [], write: ["vpaa", "dean"] },
  program: { read: [], write: ["vpaa", "dean", "departmenthead"] },
  programChair: { read: [], write: ["vpaa", "dean", "departmenthead"] },
  // Prospectuses are curated by the academic hierarchy; admin always passes.
  prospectus: {
    read: [],
    write: ["vpaa", "dean", "departmenthead", "programchair"],
  },
  prospectusItem: {
    read: [],
    write: ["vpaa", "dean", "departmenthead", "programchair"],
  },
  // Only the VPAA (and admin) can appoint the university's FDIS chair.
  fdisChair: { read: [], write: ["vpaa"] },
  // Only the VPAA (and admin) can appoint the CITL director.
  citlDirector: { read: [], write: ["vpaa"] },
  // Admin only: nobody appoints the VPAA from inside the app.
  vpaa: { read: [], write: [] },
  // Admin only for now. See the note at the end before widening this.
  faculty: { read: [], write: [] },
  // Admin always passes, so an empty list means "admin only".
  user: { read: [], write: [] },
} as const satisfies Record<string, Rule>;
