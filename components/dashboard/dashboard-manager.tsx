"use client";

import {
  getDashboardScope,
  type DashboardFilters,
  type DashboardParams,
  type DashboardScopeResponse,
} from "@/lib/dashboard-client";
import { listTerms, type TermResponse } from "@/lib/term-client";
import { Field, Label, Select } from "@headlessui/react";
import { useEffect, useMemo, useState } from "react";
import { termLabel } from "../syllabus/syllabus-status";
import { JustificationsPanel } from "./justifications-panel";
import { ErrorBanner } from "./panel-parts";
import { ScopeFilters } from "./scope-filters";
import { SignedCopiesPanel } from "./signed-copies-panel";
import { SummaryPanel } from "./summary-panel";

/** Terms come newest school year first; prefer the newest open one. */
function defaultTerm(terms: readonly TermResponse[]): string {
  return (terms.find((t) => t.open) ?? terms[0])?.id ?? "";
}

export function DashboardManager() {
  const [scope, setScope] = useState<DashboardScopeResponse | null>(null);
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Scope and terms load once; every panel waits for both.
  // (The API caps perPage at 100 terms; more would need a searchable picker.)
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      getDashboardScope(controller.signal),
      listTerms({ page: 1, perPage: 100 }, controller.signal),
    ])
      .then(([scopeResult, termResult]) => {
        setScope(scopeResult);
        setTerms(termResult.items);
        setTerm((current) => current || defaultTerm(termResult.items));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const params = useMemo<DashboardParams>(
    () => ({ term, ...filters }),
    [term, filters],
  );
  // Remounting the panels on a filter change sends each back to page 1.
  const panelKey = `${term}|${filters.college ?? ""}|${filters.department ?? ""}|${filters.program ?? ""}`;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">
        Where the term&apos;s syllabi stand in your scope. Deadlines are shown in
        Philippine time and never block anything.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <Field className="lg:w-64">
          <Label className="text-sm font-medium text-gray-900">Term</Label>
          <Select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            disabled={loading || terms.length === 0}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-50"
          >
            {terms.length === 0 && <option value="">No terms yet</option>}
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {termLabel({
                  semester: t.semester,
                  school_year_label: t.expand?.school_year?.label ?? "",
                })}
                {t.open ? " (open)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        {scope && (
          <ScopeFilters programs={scope.programs} value={filters} onChange={setFilters} />
        )}
      </div>

      {loading && !scope && (
        <p className="mt-8 text-sm text-gray-500">Loading…</p>
      )}
      {scope && !term && (
        <p className="mt-8 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
          There are no terms yet. An administrator adds them under School Years &amp; Terms.
        </p>
      )}
      {scope && term && (
        <div key={panelKey}>
          <SummaryPanel params={params} />
          <SignedCopiesPanel params={params} />
          {scope.justifications && <JustificationsPanel params={params} />}
        </div>
      )}
    </div>
  );
}
