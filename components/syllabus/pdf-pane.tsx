"use client";

import { formatDate } from "@/lib/format-date";
import {
  syllabusVersionFileUrl,
  type SyllabusVersionResponse,
} from "@/lib/syllabus-client";
import { Field, Label, Select } from "@headlessui/react";

type PdfPaneProps = {
  syllabusId: string;
  /** Newest first, as the versions API lists them. */
  versions: SyllabusVersionResponse[];
  selectedId: string | null;
  onSelect: (versionId: string) => void;
  /** Extra tags per version id, e.g. "returned" or "your revision". */
  tags?: Readonly<Record<string, string>>;
};

/**
 * The browser's own PDF viewer in a frame, on the protected file route
 * (served inline, same origin). Some mobile browsers show only the first
 * page in a frame, so the new-tab link is always there.
 */
export function PdfPane({ syllabusId, versions, selectedId, onSelect, tags = {} }: PdfPaneProps) {
  const selected = versions.find((v) => v.id === selectedId) ?? versions[0];

  if (!selected) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500 ring-1 ring-black/5">
        No PDF uploaded yet.
      </div>
    );
  }

  const url = syllabusVersionFileUrl(syllabusId, selected.id);
  const label = (v: SyllabusVersionResponse) =>
    `v${v.version_no}, uploaded ${formatDate(v.created)}${tags[v.id] ? ` (${tags[v.id]})` : ""}`;

  return (
    <div className="flex h-full min-h-[32rem] flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Field className="min-w-0 flex-1">
          <Label className="block text-xs font-medium text-gray-700">Version</Label>
          <Select
            value={selected.id}
            onChange={(e) => onSelect(e.target.value)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {label(v)}
              </option>
            ))}
          </Select>
        </Field>
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Open in new tab
          <span className="sr-only"> (version {selected.version_no})</span>
        </a>
      </div>
      <iframe
        key={selected.id}
        src={url}
        title={`Syllabus PDF v${selected.version_no}`}
        className="min-h-[28rem] w-full flex-1 rounded-lg bg-white ring-1 ring-black/5"
      />
    </div>
  );
}
