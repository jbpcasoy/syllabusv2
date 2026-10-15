import { NextResponse, type NextRequest } from "next/server";

// Duplicated from lib/auth.ts on purpose: that file imports "server-only"
// and next/headers, which the proxy shouldn't pull in.
const AUTH_COOKIE = "pb_auth";
const LOGIN_PATH = "/login";
const PUBLIC_PATHS = [LOGIN_PATH, "/register"];

/**
 * Cheap, optimistic check: decode the JWT payload and look at `exp`.
 * This does NOT verify the signature. Real validation still happens
 * in getCurrentUser() / requireUser() on the server.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp !== "number" || exp * 1000 <= Date.now();
  } catch {
    return true; // malformed token
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token && !isTokenExpired(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", pathname + search);

  const response = NextResponse.redirect(url);
  if (token) response.cookies.delete(AUTH_COOKIE); // clear the stale cookie
  return response;
}

export const config = {
  // Run on pages only: skip /api, Next internals, and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
