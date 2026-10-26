import PocketBase from "pocketbase";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

type UserRow = { id: string; email: string; name: string; isAdmin: boolean };
type AssignmentRow = { id: string; user: string; active: boolean };

// Every assignment collection and the title it grants.
const ASSIGNMENTS = [
  { collection: "program_chairs", title: "Program Chair" },
  { collection: "department_heads", title: "Department Head" },
  { collection: "deans", title: "Dean" },
  { collection: "faculties", title: "Faculty" },
  { collection: "fdis_chairs", title: "FDIS Chair" },
  { collection: "citl_directors", title: "CITL Director" },
  { collection: "vpaas", title: "VPAA" },
] as const;

// Keep in sync with userKindFilter() in lib/users.ts (this script can't import server-only code).
const ASSIGNED_FILTER = `(${ASSIGNMENTS.map((a) => `${a.collection}_via_user.active ?= true`).join(" || ")})`;
const UNASSIGNED_FILTER = [
  "isAdmin = false",
  ...ASSIGNMENTS.map((a) => `${a.collection}_via_user.active != true`),
].join(" && ");

async function main() {
  const pb = new PocketBase(requireEnv("POCKETBASE_URL"));
  pb.autoCancellation(false);
  await pb
    .collection("_superusers")
    .authWithPassword(
      requireEnv("POCKETBASE_SUPERUSER_EMAIL"),
      requireEnv("POCKETBASE_SUPERUSER_PASSWORD"),
    );

  const users = await pb.collection("users").getFullList<UserRow>({
    fields: "id,email,name,isAdmin",
    sort: "email",
  });

  // userId -> roles implied by ACTIVE assignment records
  const derived = new Map<string, Set<string>>();
  for (const { collection, title } of ASSIGNMENTS) {
    const rows = await pb.collection(collection).getFullList<AssignmentRow>({
      fields: "id,user,active",
      filter: "active = true",
    });
    for (const row of rows) {
      const set = derived.get(row.user) ?? new Set<string>();
      set.add(title);
      derived.set(row.user, set);
    }
  }

  // 1. Users with their admin flag and derived roles
  console.log("\n=== Users: admin flag and derived roles ===");
  console.table(
    users.map((u) => ({
      email: u.email,
      name: u.name,
      isAdmin: u.isAdmin === true,
      derived: [...(derived.get(u.id) ?? [])].join(", ") || "(unassigned)",
    })),
  );

  // 2. Org integrity
  const programs = await pb
    .collection("programs")
    .getFullList<{ id: string; name: string; code: string; department: string }>(
      { fields: "id,name,code,department" },
    );
  const departments = await pb
    .collection("departments")
    .getFullList<{ id: string; name: string; college: string }>({
      fields: "id,name,college",
    });

  console.log("\n=== Programs without a department ===");
  console.table(programs.filter((p) => !p.department));

  console.log("\n=== Departments without a college ===");
  console.table(departments.filter((d) => !d.college));

  // 3. Cross-check the users list filters (GET /api/user?kind=...) against the computed sets.
  const ids = async (filter: string) =>
    new Set(
      (
        await pb
          .collection("users")
          .getFullList<{ id: string }>({ fields: "id", filter })
      ).map((u) => u.id),
    );
  const expectedAssigned = new Set(
    users.filter((u) => derived.has(u.id)).map((u) => u.id),
  );
  const expectedUnassigned = new Set(
    users.filter((u) => !u.isAdmin && !derived.has(u.id)).map((u) => u.id),
  );
  const same = (a: Set<string>, b: Set<string>) =>
    a.size === b.size && [...a].every((id) => b.has(id));
  const assignedOk = same(await ids(ASSIGNED_FILTER), expectedAssigned);
  const unassignedOk = same(await ids(UNASSIGNED_FILTER), expectedUnassigned);

  // 4. Summary
  const admins = users.filter((u) => u.isAdmin === true);
  console.log("\n=== Summary ===");
  console.table({
    users: users.length,
    admins: admins.length,
    withAssignments: expectedAssigned.size,
    unassigned: expectedUnassigned.size,
    programsWithoutDepartment: programs.filter((p) => !p.department).length,
    departmentsWithoutCollege: departments.filter((d) => !d.college).length,
    "kind=assigned filter matches": assignedOk,
    "kind=unassigned filter matches": unassignedOk,
  });

  if (admins.length === 0) {
    console.error(
      "\nNo user has isAdmin = true. Set it on at least one account in the PocketBase dashboard.",
    );
    process.exitCode = 1;
  }
  if (!assignedOk || !unassignedOk) {
    console.error(
      "\nA users list filter disagrees with the computed set. Check userKindFilter() in lib/users.ts.",
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
