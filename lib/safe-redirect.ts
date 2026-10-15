/** Only allow same-site relative paths (e.g. "/college"). Falls back to "/". */
export function safeRedirect(
  value: string | string[] | null | undefined,
  fallback = "/",
): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return fallback;
  }
  return next;
}
