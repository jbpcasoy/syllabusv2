"use client";

import { formatDate } from "@/lib/format-date";
import {
  checklistCriteria,
  CURRENT_FORM17,
  getForm17 as formDefinition,
} from "@/lib/forms";
import {
  getForm17,
  saveForm17,
  type Form17Response,
} from "@/lib/syllabus-client";
import type { Form17Answer, Form17AnswerInput } from "@/types/form17";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Field,
  Label,
  Radio,
  RadioGroup,
  Textarea,
} from "@headlessui/react";
import { useEffect, useState } from "react";

type Form17PanelProps = {
  syllabusId: string;
  /** The viewer is the reviewer at the current stage. */
  editable: boolean;
};

type Draft = Record<string, { answer: Form17Answer | ""; remarks: string }>;

const inputClass =
  "mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50";

function draftFrom(form: Form17Response): Draft {
  const draft: Draft = {};
  for (const answer of form.answers) {
    draft[answer.criterion] = { answer: answer.answer, remarks: answer.remarks };
  }
  return draft;
}

/** Form 17 (OVPAA-F-INS-017): one shared Yes/No checklist per version. */
export function Form17Panel({ syllabusId, editable }: Form17PanelProps) {
  const [form, setForm] = useState<Form17Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [draft, setDraft] = useState<Draft>({});
  const [suggestions, setSuggestions] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getForm17(syllabusId, undefined, controller.signal)
      .then((result) => {
        setForm(result);
        setDraft(draftFrom(result));
        setSuggestions(result.suggestions);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });

    return () => controller.abort();
  }, [syllabusId, reloadKey]);

  const definition =
    (form && formDefinition(form.form_revision)) ?? CURRENT_FORM17;
  const saved = form ? draftFrom(form) : {};
  const changed: Form17AnswerInput[] = checklistCriteria(definition)
    .map((c) => c.key)
    .filter((key) => {
      const now = draft[key];
      const before = saved[key];
      return (
        now?.answer &&
        (now.answer !== before?.answer || now.remarks.trim() !== before?.remarks)
      );
    })
    .map((key) => ({
      criterion: key,
      answer: draft[key].answer as Form17Answer,
      remarks: draft[key].remarks.trim(),
    }));
  const suggestionsChanged = !!form && suggestions.trim() !== form.suggestions;
  const answered = Object.values(draft).filter((d) => d.answer).length;
  const total = checklistCriteria(definition).length;

  function setAnswer(key: string, patch: Partial<Draft[string]>) {
    setDraft((prev) => {
      const current = prev[key] ?? { answer: "", remarks: "" };
      return { ...prev, [key]: { ...current, ...patch } };
    });
  }

  async function handleSave() {
    const missingRemarks = changed.find((a) => a.answer === "no" && !a.remarks);
    if (missingRemarks) {
      setSaveError(`A "No" on ${missingRemarks.criterion} needs remarks.`);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveForm17(syllabusId, {
        answers: changed,
        ...(suggestionsChanged && { suggestions: suggestions.trim() }),
      });
      setForm(result);
      setDraft(draftFrom(result));
      setSuggestions(result.suggestions);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg bg-white p-4 shadow ring-1 ring-black/5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">
          Form 17: Review Checklist
        </h2>
        <span className="text-xs text-gray-500">
          {definition.code} · Rev {definition.revision}
          {form && ` · Version ${form.version.version_no}`}
        </span>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      ) : (
        form && (
          <p className="mt-1 text-sm text-gray-600">
            {answered} of {total} answered
            {form.has_no && (
              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                Has a &quot;No&quot;: approval is blocked
              </span>
            )}
          </p>
        )
      )}

      <div className={loading ? "opacity-50" : ""}>
        {definition.sections.map((section) => (
          <div key={section.key} className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {section.key}. {section.title}
            </h3>
            <ul className="mt-2 divide-y divide-gray-100">
              {section.criteria.map((criterion) => {
                const value = draft[criterion.key];
                return (
                  <li key={criterion.key} className="py-2 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="mr-2 font-mono text-gray-500">
                          {criterion.key}
                        </span>
                        <span className="text-gray-900">{criterion.text}</span>
                        {editable && criterion.hint && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {criterion.hint}
                          </p>
                        )}
                      </div>
                      {editable ? (
                        <RadioGroup
                          value={value?.answer ?? ""}
                          onChange={(answer) =>
                            setAnswer(criterion.key, { answer })
                          }
                          aria-label={`Answer for ${criterion.key}`}
                          disabled={saving}
                          className="flex shrink-0 gap-1"
                        >
                          {(["yes", "no"] as const).map((option) => (
                            <Radio
                              key={option}
                              value={option}
                              className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-gray-300 data-checked:text-white data-checked:ring-0 data-disabled:opacity-50 data-checked:data-[value=no]:bg-amber-600 data-checked:data-[value=yes]:bg-green-600"
                              data-value={option}
                            >
                              {option === "yes" ? "Yes" : "No"}
                            </Radio>
                          ))}
                        </RadioGroup>
                      ) : (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            value?.answer === "yes"
                              ? "bg-green-50 text-green-700"
                              : value?.answer === "no"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {value?.answer === "yes"
                            ? "Yes"
                            : value?.answer === "no"
                              ? "No"
                              : "—"}
                        </span>
                      )}
                    </div>
                    {editable && value?.answer ? (
                      <Field className="mt-1">
                        <Label className="sr-only">
                          Remarks for {criterion.key}
                        </Label>
                        <Textarea
                          rows={1}
                          value={value.remarks}
                          onChange={(e) =>
                            setAnswer(criterion.key, { remarks: e.target.value })
                          }
                          disabled={saving}
                          placeholder={
                            value.answer === "no"
                              ? "Remarks (required for No)"
                              : "Remarks (optional)"
                          }
                          className={inputClass}
                        />
                      </Field>
                    ) : (
                      value?.remarks && (
                        <p className="mt-1 text-gray-600">{value.remarks}</p>
                      )
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <Field className="mt-4">
          <Label className="block text-sm font-semibold text-gray-900">
            Suggestions for Improvement
          </Label>
          {editable ? (
            <Textarea
              rows={3}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              disabled={saving}
              className={inputClass}
            />
          ) : (
            <p className="mt-1 text-sm whitespace-pre-line text-gray-700">
              {form?.suggestions || "—"}
            </p>
          )}
        </Field>
      </div>

      {editable && (
        <div className="mt-4 flex items-center justify-end gap-3">
          {saveError && (
            <p role="alert" className="text-sm text-red-600">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (changed.length === 0 && !suggestionsChanged)}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save checklist"}
          </button>
        </div>
      )}

      {form && form.changes.length > 0 && (
        <Disclosure as="div" className="mt-4">
          <DisclosureButton className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Edit log ({form.changes.length})
          </DisclosureButton>
          <DisclosurePanel as="ul" className="mt-2 space-y-1 text-xs text-gray-600">
            {form.changes.map((change, i) => (
              <li key={i}>
                <span className="font-mono">{change.criterion}</span>{" "}
                {change.from_answer || "—"} → {change.to_answer} by{" "}
                {change.by.name || "—"} (stage {change.stage}),{" "}
                {formatDate(change.created)}
                {change.to_remarks !== change.from_remarks &&
                  `: "${change.to_remarks}"`}
              </li>
            ))}
          </DisclosurePanel>
        </Disclosure>
      )}
    </section>
  );
}
