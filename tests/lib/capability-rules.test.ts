import {
  CAPABILITIES,
  canAnywhere,
  evaluateCapability,
  isAdminOverride,
  type Capability,
  type ScopeChain,
} from "@/lib/capability-rules";
import { NO_ROLES, type UserRoles } from "@/types/roles";
import { describe, expect, it } from "vitest";

const roles = (partial: Partial<UserRoles>): UserRoles => ({
  ...NO_ROLES,
  ...partial,
});

const SCOPE: ScopeChain = {
  collegeId: "colgAcolgAcolgA",
  departmentId: "deptAdeptAdeptA",
  programId: "progAprogAprogA",
};
const OTHER = {
  college: "colgBcolgBcolgB",
  department: "deptBdeptBdeptB",
  program: "progBprogBprogB",
};

const ADMIN_ONLY: Capability[] = [
  "campus.write",
  "user.read",
  "user.write",
  "vpaa.write",
  "schoolYear.write",
  "term.write",
  "course.write",
  "prospectus.write",
  "prospectusItem.write",
  "audit.view",
];
const VPAA_GLOBAL: Capability[] = [
  "college.write",
  "dean.write",
  "fdisChair.write",
  "citlDirector.write",
];

const admin = roles({ isAdmin: true });
const vpaa = roles({ isVpaa: true });
const dean = roles({ deanOfColleges: [SCOPE.collegeId!] });
const head = roles({ headOfDepartments: [SCOPE.departmentId!] });
const chair = roles({ chairOfPrograms: [SCOPE.programId!] });
const facultyOnly = roles({ facultyOfPrograms: [SCOPE.programId!] });
// The six-role account from the audit (jbpacaso), all scoped to A.
const multiRole = roles({
  chairOfPrograms: [SCOPE.programId!],
  headOfDepartments: [SCOPE.departmentId!],
  deanOfColleges: [SCOPE.collegeId!],
  facultyOfPrograms: [SCOPE.programId!],
  isFdisChair: true,
  isCitlDirector: true,
});

const can = evaluateCapability;

describe("admin override", () => {
  it.each(CAPABILITIES)("admin passes %s, with or without scope", (cap) => {
    expect(can(admin, cap)).toBe(true);
    expect(can(admin, cap, { collegeId: OTHER.college })).toBe(true);
  });
});

describe("isAdminOverride", () => {
  const lead: Capability = "syllabus.transferLead";

  it("is true for an admin the rule itself refuses", () => {
    expect(isAdminOverride(admin, lead, SCOPE)).toBe(true);
  });

  it("is false for an admin who also holds the role in scope", () => {
    expect(isAdminOverride({ ...chair, isAdmin: true }, lead, SCOPE)).toBe(false);
  });

  it("is true for an admin who holds the role elsewhere only", () => {
    expect(
      isAdminOverride({ ...chair, isAdmin: true }, lead, {
        programId: OTHER.program,
      }),
    ).toBe(true);
  });

  it("is false for anyone who isn't admin, allowed or not", () => {
    expect(isAdminOverride(chair, lead, SCOPE)).toBe(false);
    expect(isAdminOverride(facultyOnly, lead, SCOPE)).toBe(false);
  });
});

describe("admin-only capabilities", () => {
  it.each(ADMIN_ONLY)("%s is denied to every non-admin profile", (cap) => {
    for (const r of [
      NO_ROLES,
      vpaa,
      dean,
      head,
      chair,
      facultyOnly,
      multiRole,
    ]) {
      expect(can(r, cap, SCOPE)).toBe(false);
    }
  });
});

describe("VPAA-global capabilities", () => {
  it.each(VPAA_GLOBAL)("%s: VPAA passes without any scope", (cap) => {
    expect(can(vpaa, cap)).toBe(true);
  });

  it.each(VPAA_GLOBAL)("%s: nobody else passes", (cap) => {
    for (const r of [NO_ROLES, dean, head, chair, facultyOnly, multiRole]) {
      expect(can(r, cap, SCOPE)).toBe(false);
    }
  });
});

describe.each(["department", "program"] as const)("%s management", (kind) => {
  const create = `${kind}.create` as Capability;
  const update = `${kind}.update` as Capability;
  const del = `${kind}.delete` as Capability;

  it("VPAA can create, update and delete anywhere", () => {
    for (const cap of [create, update, del]) expect(can(vpaa, cap)).toBe(true);
  });

  it("a dean can create, update and delete inside their college", () => {
    for (const cap of [create, update, del]) {
      expect(can(dean, cap, SCOPE)).toBe(true);
    }
  });

  it("a dean is denied outside their college", () => {
    const out: ScopeChain = { ...SCOPE, collegeId: OTHER.college };
    for (const cap of [create, update, del]) {
      expect(can(dean, cap, out)).toBe(false);
    }
  });

  it("a dean is denied when no scope is given", () => {
    expect(can(dean, create)).toBe(false);
  });

  it("a department head can update only inside their own department", () => {
    expect(can(head, update, SCOPE)).toBe(true);
    expect(
      can(head, update, { ...SCOPE, departmentId: OTHER.department }),
    ).toBe(false);
  });

  it("a department head cannot create or delete", () => {
    expect(can(head, create, SCOPE)).toBe(false);
    expect(can(head, del, SCOPE)).toBe(false);
  });

  it("chairs and plain faculty get nothing", () => {
    for (const r of [chair, facultyOnly, NO_ROLES]) {
      for (const cap of [create, update, del]) {
        expect(can(r, cap, SCOPE)).toBe(false);
      }
    }
  });
});

describe("departmentHead.write", () => {
  it("VPAA passes anywhere", () => {
    expect(can(vpaa, "departmentHead.write")).toBe(true);
  });

  it("a dean passes only for departments of their college", () => {
    expect(can(dean, "departmentHead.write", SCOPE)).toBe(true);
    expect(
      can(dean, "departmentHead.write", { ...SCOPE, collegeId: OTHER.college }),
    ).toBe(false);
  });

  it("department heads and chairs cannot appoint heads", () => {
    expect(can(head, "departmentHead.write", SCOPE)).toBe(false);
    expect(can(chair, "departmentHead.write", SCOPE)).toBe(false);
  });
});

describe("programChair.write", () => {
  it("VPAA passes anywhere", () => {
    expect(can(vpaa, "programChair.write")).toBe(true);
  });

  it("a dean passes only inside their college", () => {
    expect(can(dean, "programChair.write", SCOPE)).toBe(true);
    expect(
      can(dean, "programChair.write", { ...SCOPE, collegeId: OTHER.college }),
    ).toBe(false);
  });

  it("a department head passes only for programs of their department", () => {
    expect(can(head, "programChair.write", SCOPE)).toBe(true);
    expect(
      can(head, "programChair.write", {
        ...SCOPE,
        departmentId: OTHER.department,
      }),
    ).toBe(false);
  });

  it("a chair cannot appoint chairs", () => {
    expect(can(chair, "programChair.write", SCOPE)).toBe(false);
  });
});

describe("programReviewer.write", () => {
  it("VPAA passes anywhere", () => {
    expect(can(vpaa, "programReviewer.write")).toBe(true);
  });

  it("a dean passes only inside their college", () => {
    expect(can(dean, "programReviewer.write", SCOPE)).toBe(true);
    expect(
      can(dean, "programReviewer.write", { ...SCOPE, collegeId: OTHER.college }),
    ).toBe(false);
  });

  it("a department head passes only for programs of their department", () => {
    expect(can(head, "programReviewer.write", SCOPE)).toBe(true);
    expect(
      can(head, "programReviewer.write", {
        ...SCOPE,
        departmentId: OTHER.department,
      }),
    ).toBe(false);
  });

  it("chairs and program reviewers cannot appoint reviewers", () => {
    expect(can(chair, "programReviewer.write", SCOPE)).toBe(false);
    const reviewer = roles({ reviewerOfPrograms: [SCOPE.programId!] });
    expect(can(reviewer, "programReviewer.write", SCOPE)).toBe(false);
  });
});

describe("syllabus.transferLead", () => {
  it("passes for the program's chair and admin", () => {
    expect(can(chair, "syllabus.transferLead", SCOPE)).toBe(true);
    expect(can(roles({ isAdmin: true }), "syllabus.transferLead", SCOPE)).toBe(true);
  });

  it("refuses everyone else, and a chair of another program", () => {
    for (const who of [vpaa, dean, head, facultyOnly]) {
      expect(can(who, "syllabus.transferLead", SCOPE)).toBe(false);
    }
    expect(
      can(chair, "syllabus.transferLead", { ...SCOPE, programId: OTHER.program }),
    ).toBe(false);
  });
});

describe.each(["signedCopy.return", "justification.return"] as const)("%s", (capability) => {
  it.each([
    ["the program's reviewer", roles({ reviewerOfPrograms: [SCOPE.programId!] })],
    ["the dean of its college", dean],
    ["the FDIS chair", roles({ isFdisChair: true })],
    ["the CITL director", roles({ isCitlDirector: true })],
    ["the VPAA", vpaa],
    ["an admin", roles({ isAdmin: true })],
  ])("passes for %s", (_label, who) => {
    expect(can(who, capability, SCOPE)).toBe(true);
  });

  it.each([
    ["the department head", head],
    ["the program chair", chair],
    ["faculty", roles({ facultyOfPrograms: [SCOPE.programId!] })],
  ])("refuses %s", (_label, who) => {
    expect(can(who, capability, SCOPE)).toBe(false);
  });

  it("limits the program reviewer and dean to their scope", () => {
    const reviewer = roles({ reviewerOfPrograms: [SCOPE.programId!] });
    expect(
      can(reviewer, capability, { ...SCOPE, programId: OTHER.program }),
    ).toBe(false);
    expect(can(dean, capability, { ...SCOPE, collegeId: OTHER.college })).toBe(false);
  });
});

describe("reviewQueue.view", () => {
  it.each([
    ["a program reviewer", roles({ reviewerOfPrograms: [OTHER.program] })],
    ["a dean", roles({ deanOfColleges: [OTHER.college] })],
    ["the FDIS chair", roles({ isFdisChair: true })],
    ["the CITL director", roles({ isCitlDirector: true })],
    ["the VPAA", vpaa],
    ["an admin", admin],
    ["faculty who proxy on a syllabus", roles({ facultyOfPrograms: [OTHER.program], standsIn: true })],
    ["a stand-in with no role", roles({ standsIn: true })],
  ])("passes for %s, without any scope", (_label, who) => {
    expect(can(who, "reviewQueue.view")).toBe(true);
    expect(canAnywhere(who, "reviewQueue.view")).toBe(true);
  });

  it.each([
    ["the department head", head],
    ["the program chair", chair],
    ["faculty", facultyOnly],
  ])("refuses %s", (_label, who) => {
    expect(canAnywhere(who, "reviewQueue.view")).toBe(false);
  });
});

describe("dashboard.view", () => {
  it.each([
    ["a program reviewer", roles({ reviewerOfPrograms: [OTHER.program] })],
    ["a program chair", roles({ chairOfPrograms: [OTHER.program] })],
    ["a department head", roles({ headOfDepartments: [OTHER.department] })],
    ["a dean", roles({ deanOfColleges: [OTHER.college] })],
    ["the FDIS chair", roles({ isFdisChair: true })],
    ["the CITL director", roles({ isCitlDirector: true })],
    ["the VPAA", vpaa],
    ["an admin", admin],
  ])("passes for %s, without any scope", (_label, who) => {
    expect(can(who, "dashboard.view")).toBe(true);
    expect(canAnywhere(who, "dashboard.view")).toBe(true);
  });

  it.each([
    ["faculty", facultyOnly],
    ["an unassigned user", roles({})],
  ])("refuses %s", (_label, who) => {
    expect(canAnywhere(who, "dashboard.view")).toBe(false);
  });
});

describe("user.pick", () => {
  it.each([
    ["a program chair", roles({ chairOfPrograms: [OTHER.program] })],
    ["a department head", roles({ headOfDepartments: [OTHER.department] })],
    ["a dean", roles({ deanOfColleges: [OTHER.college] })],
    ["the VPAA", vpaa],
    ["an admin", admin],
  ])("passes for %s, without any scope", (_label, who) => {
    expect(can(who, "user.pick")).toBe(true);
  });

  it.each([
    ["faculty", facultyOnly],
    ["a program reviewer", roles({ reviewerOfPrograms: [OTHER.program] })],
    ["the FDIS chair", roles({ isFdisChair: true })],
    ["the CITL director", roles({ isCitlDirector: true })],
    ["an unassigned user", roles({})],
  ])("refuses %s", (_label, who) => {
    expect(can(who, "user.pick")).toBe(false);
  });
});

describe("faculty.write", () => {
  it("a chair passes only for their own program", () => {
    expect(can(chair, "faculty.write", SCOPE)).toBe(true);
    expect(
      can(chair, "faculty.write", { ...SCOPE, programId: OTHER.program }),
    ).toBe(false);
  });

  it("denied when no scope is given", () => {
    expect(can(chair, "faculty.write")).toBe(false);
  });

  it("VPAA, dean, head and plain faculty are denied", () => {
    for (const r of [vpaa, dean, head, facultyOnly, NO_ROLES]) {
      expect(can(r, "faculty.write", SCOPE)).toBe(false);
    }
  });
});

describe("programJoinRequest.review", () => {
  it("a chair passes only for their own program", () => {
    expect(can(chair, "programJoinRequest.review", SCOPE)).toBe(true);
    expect(
      can(chair, "programJoinRequest.review", {
        ...SCOPE,
        programId: OTHER.program,
      }),
    ).toBe(false);
  });

  it("VPAA, dean, head and plain faculty are denied", () => {
    for (const r of [vpaa, dean, head, facultyOnly, NO_ROLES]) {
      expect(can(r, "programJoinRequest.review", SCOPE)).toBe(false);
    }
  });
});

describe("programJoinRequest.approveOwn", () => {
  it("a department head passes only for programs in their department", () => {
    expect(can(head, "programJoinRequest.approveOwn", SCOPE)).toBe(true);
    expect(
      can(head, "programJoinRequest.approveOwn", {
        ...SCOPE,
        departmentId: OTHER.department,
      }),
    ).toBe(false);
  });

  it("a chair alone, VPAA, dean and plain faculty are denied", () => {
    for (const r of [chair, vpaa, dean, facultyOnly, NO_ROLES]) {
      expect(can(r, "programJoinRequest.approveOwn", SCOPE)).toBe(false);
    }
  });

  it("admin passes", () => {
    expect(can(admin, "programJoinRequest.approveOwn", SCOPE)).toBe(true);
  });
});

describe("syllabusReference.request", () => {
  it("a chair passes only for their own program", () => {
    expect(can(chair, "syllabusReference.request", SCOPE)).toBe(true);
    expect(
      can(chair, "syllabusReference.request", {
        ...SCOPE,
        programId: OTHER.program,
      }),
    ).toBe(false);
  });

  it("is denied without a scope", () => {
    expect(can(chair, "syllabusReference.request")).toBe(false);
  });

  it("VPAA, dean, head and plain faculty are denied", () => {
    for (const r of [vpaa, dean, head, facultyOnly, NO_ROLES]) {
      expect(can(r, "syllabusReference.request", SCOPE)).toBe(false);
    }
  });

  it("admin passes", () => {
    expect(can({ ...NO_ROLES, isAdmin: true }, "syllabusReference.request", SCOPE)).toBe(true);
  });
});

describe("users who hold several roles", () => {
  it("combines scoped powers", () => {
    expect(can(multiRole, "faculty.write", SCOPE)).toBe(true);
    expect(can(multiRole, "department.create", SCOPE)).toBe(true);
    expect(can(multiRole, "programChair.write", SCOPE)).toBe(true);
  });

  it("is still limited to its own scope", () => {
    const out: ScopeChain = {
      collegeId: OTHER.college,
      departmentId: OTHER.department,
      programId: OTHER.program,
    };
    expect(can(multiRole, "faculty.write", out)).toBe(false);
    expect(can(multiRole, "department.create", out)).toBe(false);
  });

  it("FDIS chair and CITL director grant no write power by themselves", () => {
    expect(can(multiRole, "college.write")).toBe(false);
    expect(can(multiRole, "campus.write")).toBe(false);
  });
});

describe("users with no roles", () => {
  it.each(CAPABILITIES)("are denied %s", (cap) => {
    expect(can(NO_ROLES, cap, SCOPE)).toBe(false);
    expect(can(NO_ROLES, cap)).toBe(false);
  });
});

describe("canAnywhere", () => {
  it.each(CAPABILITIES)("is true for admin on %s", (cap) => {
    expect(canAnywhere(roles({ isAdmin: true }), cap)).toBe(true);
  });

  it("is true for a global role without any scope", () => {
    expect(canAnywhere(roles({ isVpaa: true }), "college.write")).toBe(true);
  });

  it("is true when the capability holds in one of the user's scopes", () => {
    const dean = roles({ deanOfColleges: [SCOPE.collegeId!] });
    const head = roles({ headOfDepartments: [SCOPE.departmentId!] });
    const chair = roles({ chairOfPrograms: [SCOPE.programId!] });

    expect(canAnywhere(dean, "programChair.write")).toBe(true);
    expect(canAnywhere(head, "programChair.write")).toBe(true);
    expect(canAnywhere(head, "department.update")).toBe(true);
    expect(canAnywhere(chair, "faculty.write")).toBe(true);
  });

  it("is false when none of the user's scopes grants it", () => {
    const head = roles({ headOfDepartments: [SCOPE.departmentId!] });
    const chair = roles({ chairOfPrograms: [SCOPE.programId!] });
    const faculty = roles({ facultyOfPrograms: [SCOPE.programId!] });

    expect(canAnywhere(head, "department.create")).toBe(false);
    expect(canAnywhere(chair, "programChair.write")).toBe(false);
    expect(canAnywhere(faculty, "faculty.write")).toBe(false);
    expect(canAnywhere(NO_ROLES, "user.read")).toBe(false);
  });
});
