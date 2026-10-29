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
      <CollegeManager canManage={await canSomewhere(user, "college.write")} />
    </main>
  );
}
