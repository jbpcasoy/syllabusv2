import { ReferenceManager } from "@/components/syllabus-reference/reference-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { getUserRoles } from "@/lib/roles";
import { redirect } from "next/navigation";

export const metadata = { title: "Syllabus references" };

export default async function SyllabusReferencePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/syllabus-reference");

  // Cached per request, so canSomewhere reuses it.
  const roles = await getUserRoles(user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ReferenceManager
        viewer={{
          id: user.id,
          isAdmin: roles.isAdmin,
          chairOfPrograms: roles.chairOfPrograms,
        }}
        canRequest={await canSomewhere(user, "syllabusReference.request")}
      />
    </main>
  );
}
