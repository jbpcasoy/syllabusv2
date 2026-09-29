export function formatDate(value?: string) {
  if (!value) return "—";
  // PocketBase dates look like "2026-09-29 01:13:42.470Z"
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
