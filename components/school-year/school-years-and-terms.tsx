"use client";

import { TermManager } from "@/components/term/term-manager";
import { useState } from "react";
import { SchoolYearManager } from "./school-year-manager";

type SchoolYearsAndTermsProps = {
  canManageSchoolYears: boolean;
  canManageTerms: boolean;
};

/** Both lists on one page; a school year change refreshes the term list. */
export function SchoolYearsAndTerms({
  canManageSchoolYears,
  canManageTerms,
}: SchoolYearsAndTermsProps) {
  const [schoolYearsKey, setSchoolYearsKey] = useState(0);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          School years and terms
        </h1>
      </div>
      <SchoolYearManager
        canManage={canManageSchoolYears}
        onChanged={() => setSchoolYearsKey((k) => k + 1)}
      />
      <TermManager canManage={canManageTerms} schoolYearsKey={schoolYearsKey} />
    </div>
  );
}
