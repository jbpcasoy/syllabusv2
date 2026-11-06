import { confirmEmailVerification } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Confirm email" };

type ConfirmEmailPageProps = { params: Promise<{ token: string }> };

// Landing page for the emailed verification link. Public: the reader has
// just registered and cannot sign in until this succeeds.
export default async function ConfirmEmailPage({
  params,
}: ConfirmEmailPageProps) {
  const { token } = await params;
  const verified = await confirmEmailVerification(token);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow ring-1 ring-black/5">
        {verified ? (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your account is ready. You can sign in now.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">
              Link expired or invalid
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              This verification link no longer works. It may have expired or
              already been used. Sign in to have a new one sent.
            </p>
          </>
        )}
        <Link
          href="/login"
          className="mt-6 inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Go to sign in
        </Link>
      </div>
    </main>
  );
}
