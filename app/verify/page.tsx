import { VerifyForm } from "@/components/verify/verify-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Verify approval" };

// Any signed-in user may type a printed approval code to check it.
export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/verify")}`);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Verify approval</h1>
      <p className="mt-1 text-sm text-gray-600">
        Enter the reference code printed next to a signature line on an
        exported review form.
      </p>
      <div className="mt-6">
        <VerifyForm />
      </div>
    </main>
  );
}
