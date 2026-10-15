import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";
import { safeRedirect } from "@/lib/safe-redirect";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in" };

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const redirectTo = safeRedirect(next);

  // Already signed in? Skip the form.
  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and password to continue.
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5">
          <LoginForm redirectTo={redirectTo} />
          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href={
                redirectTo === "/"
                  ? "/register"
                  : `/register?next=${encodeURIComponent(redirectTo)}`
              }
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
