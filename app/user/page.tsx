import { UserManager } from "@/components/user/user-manager";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Users" };

export default async function UserPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/user");

  if (user.role !== "admin") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="mt-2 text-sm text-gray-600">
          You don&apos;t have permission to manage users.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <UserManager currentUserId={user.id} />
    </main>
  );
}
