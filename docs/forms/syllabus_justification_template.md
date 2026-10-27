# Template: Syllabus Justification for Lead Faculty

> Source: `_TEMPLATE__Syllabus_Justification_for_Lead_Faculty_docx.pdf` (1 page, letter format)
> Purpose: A formal letter from a faculty member to the CITL Director, reporting syllabi that lack the Lead Faculty's signature, with a justification for each.

---

## 1. Document Overview

| Property | Value |
|---|---|
| Document type | Formal business letter (1 page) |
| Institution | Bukidnon State University (BukSU) |
| Recipient | CITL Director (fixed) |
| Sender | The faculty member (signs at bottom) |
| Endorsed by | Program Chair ("Noted") |
| Body font (appears to be) | Serif (Palatino/Book Antiqua style) |

---

## 2. Letterhead (fixed, centered at top)

- **Logo:** BukSU circular seal, placed to the left of the university name
- **Line 1 (bold, larger):** `BUKIDNON STATE UNIVERSITY`
- **Line 2 (small):** `Malaybalay City, Bukidnon 8700`
- **Line 3 (small):** `Tel (088) 813-5661 to 5663; Telefax (088) 813-2717, www.buksu.edu.ph`
  - `www.buksu.edu.ph` is a blue hyperlink

---

## 3. Letter Body (in order, top to bottom)

### 3.1 Date — VARIABLE
```
{{DATE}}
```
Example in template: `April 11, 2025` (format: `Month DD, YYYY`)

### 3.2 Recipient block — FIXED
```
Dr. Cecille Marie T. Improgo
CITL Director
Bukidnon State University
Malaybalay, Bukidnon
```

### 3.3 Salutation — FIXED
```
Dear Madam:
```

### 3.4 Opening paragraph — PARTLY VARIABLE
```
The undersigned wishes to inform your good office that the following syllabus/es for {{SEMESTER}}, {{SY}} do/es not have the affixed signature of the Lead Faculty:
```

- `{{SEMESTER}}` and `{{SY}}` are **bold + underlined** in the template (they are the blanks to fill in).
- `{{SEMESTER}}` e.g. `1st Semester` / `2nd Semester` / `Summer`
- `{{SY}}` e.g. `SY 2024-2025` (School Year)
- Keep the literal wording `syllabus/es` and `do/es` as-is unless the user asks to change it.

### 3.5 Table — VARIABLE (see Section 4)

### 3.6 Closing — FIXED
```
Thank you for your consideration.

Very truly yours,
```

### 3.7 Signature blocks — FIXED labels, signature lines left blank

```
_________________________________
Signature over printed name of Faculty

Noted:

_________________________________
Signature over printed name of Program Chair
```

- Leave the signature lines blank for wet/e-signature.
- The faculty (sender) prints their name over the first line; the Program Chair over the second.

---

## 4. Table Specification

**Columns (4, in this order):**

| # | Header | Alignment | Notes |
|---|---|---|---|
| 1 | Course Code | left | narrowest column; header wraps to two lines ("Course / Code") |
| 2 | Course Title | center header | |
| 3 | Lead Author | center header | name of the Lead Faculty who did not sign |
| 4 | Justification | center header | reason the signature is missing |

**Rows:** 1 header row + 4 data rows (empty rows are kept in the template for adding more entries).

**Styling:** Full black borders on all cells, no shading, full text width of page.

**Pre-filled example row in the template:**

| Course Code | Course Title | Lead Author | Justification |
|---|---|---|---|
| Prof Ed 1 | *(blank)* | Maria Angelica C. Mugot | *(blank)* |

**Blank template version:**

| Course Code | Course Title | Lead Author | Justification |
|---|---|---|---|
| {{COURSE_CODE_1}} | {{COURSE_TITLE_1}} | {{LEAD_AUTHOR_1}} | {{JUSTIFICATION_1}} |
| {{COURSE_CODE_2}} | {{COURSE_TITLE_2}} | {{LEAD_AUTHOR_2}} | {{JUSTIFICATION_2}} |
| {{COURSE_CODE_3}} | {{COURSE_TITLE_3}} | {{LEAD_AUTHOR_3}} | {{JUSTIFICATION_3}} |
| {{COURSE_CODE_4}} | {{COURSE_TITLE_4}} | {{LEAD_AUTHOR_4}} | {{JUSTIFICATION_4}} |

---

## 5. Placeholder Reference

| Placeholder | Type | Required | Example |
|---|---|---|---|
| `{{DATE}}` | string | yes | `April 11, 2025` |
| `{{SEMESTER}}` | string | yes | `1st Semester` |
| `{{SY}}` | string | yes | `SY 2024-2025` |
| `{{COURSE_CODE_n}}` | string | yes per row | `Prof Ed 1` |
| `{{COURSE_TITLE_n}}` | string | yes per row | `The Child and Adolescent Learners` |
| `{{LEAD_AUTHOR_n}}` | string | yes per row | `Maria Angelica C. Mugot` |
| `{{JUSTIFICATION_n}}` | string | yes per row | `Lead faculty is on official leave.` |

---

## 6. Structured Data Form (JSON)

Use this shape if generating the letter programmatically:

```json
{
  "date": "April 11, 2025",
  "semester": "1st Semester",
  "school_year": "SY 2024-2025",
  "recipient": {
    "name": "Dr. Cecille Marie T. Improgo",
    "title": "CITL Director",
    "institution": "Bukidnon State University",
    "location": "Malaybalay, Bukidnon"
  },
  "syllabi": [
    {
      "course_code": "Prof Ed 1",
      "course_title": "",
      "lead_author": "Maria Angelica C. Mugot",
      "justification": ""
    }
  ],
  "signatories": {
    "faculty": "",
    "program_chair": ""
  }
}
```

---

## 7. Notes for Claude Code

- **Fixed text** (letterhead, recipient, salutation, closing, signature labels) must not be altered.
- **Variable text** is only: date, semester, SY, and table rows.
- The table should support **adding/removing rows**; the template shows 4 data rows but this is not a hard limit.
- The "Course Title" and "Justification" cells in the sample row are intentionally empty; treat them as fields the user must fill in.
- If outputting to `.docx`, preserve: letterhead layout with logo, bold+underline on the semester/SY blank, bordered table, and the two signature lines.
- The logo image is **not included** in this markdown; it must be supplied separately (BukSU seal).
