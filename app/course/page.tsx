import { CourseManager } from "@/components/course/course-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import { redirect } from "next/navigation";

export const metadata = { title: "Courses" };

export default async function CoursePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/course");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <CourseManager canManage={await canSomewhere(user, "course.write")} />
    </main>
  );
}
