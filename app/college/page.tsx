import { CollegeManager } from "@/components/college/college-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "Colleges" };

export default async function CollegePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/college");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* college.write is global, so one flag covers every row. Department and
          program pages pass roles instead because their writes are scoped. */}
      <CollegeManager canManage={await canSomewhere(user, "college.write")} />
    </main>
  );
}
