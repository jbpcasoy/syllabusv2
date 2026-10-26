import { SchoolYearsAndTerms } from "@/components/school-year/school-years-and-terms";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "School years and terms" };

export default async function SchoolYearPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/school-year");

  const [canManageSchoolYears, canManageTerms] = await Promise.all([
    canSomewhere(user, "schoolYear.write"),
    canSomewhere(user, "term.write"),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <SchoolYearsAndTerms
        canManageSchoolYears={canManageSchoolYears}
        canManageTerms={canManageTerms}
      />
    </main>
  );
}
