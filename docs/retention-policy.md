# Retention policy

Status: adopted 2026-10-28 (Phase 6, decision D2).

## Rule

The syllabus review system keeps everything it records, indefinitely. Nothing is deleted automatically, and no screen in the app deletes any of the following:

| Record | Collection | Why it is kept |
| --- | --- | --- |
| Every uploaded syllabus version (PDF) | `syllabus_versions` | Form 18-1 review points cite page numbers in a specific version. |
| Signed copies, valid and returned | `syllabus_signed_copies` | The returned scans show why a filing was refused. |
| Justification letters and their scans | `syllabus_justifications` | They acknowledge previous authors. |
| Review decisions and approval codes | `syllabus_reviews` | The approval codes are printed on the wet-signed forms. |
| Form 17 answers and their change log | `form17_answers`, `form17_changes` | Later reviewers' edits are logged by design. |
| Form 18-1 review points | `form18_points` | They record the revision history. |
| Timeline events | `syllabus_events` | They show who did what, and when. |
| Audit log | `audit_log` | Accountability for status changes, overrides and uploads. |
| Notifications | `notifications` | They show who was told, and whether the email went out. |

## Removing records

Removing anything listed above is outside the app:

1. The university's records office approves the removal in writing and names the records.
2. A PocketBase superuser removes them in the PocketBase dashboard, keeping the written approval.
3. The superuser records what was removed, and under whose approval, in the records office's own register. `audit_log` has no API to record a deletion, and superuser edits in the dashboard bypass it.

Files in S3 (or on local disk when S3 isn't configured) are removed by PocketBase together with their record. Removing a file from storage by hand leaves a record whose file no longer loads.

## Storage growth

At the 20 MB limit per PDF, a syllabus with five versions, a signed copy and a justification scan uses at most about 140 MB, and typically far less. Watch the bucket's size. Raise its quota before reaching it rather than deleting records.

## Changing this policy

An automatic purge (for example, superseded versions after N years) is a decision for the review committee and the records office. It would be a new phase of work that needs a scheduled job, an audit row for each deletion, and an update to this document.
