import { CampusManager } from "@/components/campus/campus-manager";
import { getCurrentUser } from "@/lib/auth";
import { canSomewhere } from "@/lib/capabilities";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Campuses",
};

export default async function CampusPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/campus");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <CampusManager canManage={await canSomewhere(user, "campus.write")} />
    </main>
  );
}
