/**
 * CSV for the dashboard exports (Phase 5, P8). Pure, no dependency.
 *
 * - UTF-8 with a byte-order mark, so Excel reads names like "Peñaranda".
 * - CRLF line endings (RFC 4180).
 * - A text cell starting with =, +, -, @, tab or CR gets a leading ', so a
 *   spreadsheet shows it instead of running it as a formula. Numbers are
 *   written as they are.
 * - Cells with a comma, quote, CR or LF are quoted, quotes doubled.
 */

export type CsvCell = string | number | null | undefined;

const BOM = "﻿";
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;

export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return `${BOM}${lines.join("\r\n")}\r\n`;
}

/** "2026-2027 First Semester" → "2026-2027-first-semester", safe in a filename. */
export function fileSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "export"
  );
}
