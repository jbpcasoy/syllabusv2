import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirect } from "@/lib/safe-redirect";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create account" };

type RegisterPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { next } = await searchParams;
  const redirectTo = safeRedirect(next);

  // Already signed in? Skip the form.
  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  const loginHref =
    redirectTo === "/"
      ? "/login"
      : `/login?next=${encodeURIComponent(redirectTo)}`;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5">
          <RegisterForm redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}
