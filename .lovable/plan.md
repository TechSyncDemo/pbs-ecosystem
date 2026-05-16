## Goal

Restructure the exam-result lifecycle so theory marks flow in automatically from the exam portal, centers fill in practical marks once, admins fine-tune and declare, and centers receive provisional documents after admin prints.

## New end-to-end flow

```text
Student finishes exam on Exam Portal
        │  (webhook)
        ▼
exam_history row + student locked
        │
        ▼
student_results row auto-created
  status = awaiting_practical
  theory_marks / theory_total filled
        │
        ▼  Center portal → Results page
Center enters PRACTICAL marks → Submit
  status = pending      (practical_submitted_at set, both fields locked for center)
        │
        ▼  Super Admin → Results page (Declaration tab)
Admin can add / subtract on
  theory_grace  &  practical_grace
Admin clicks Declare
  status = declared, result_date set
        │
        ▼  Center sees declared marks (read-only)
        │
        ▼  Super Admin → Printing Queue, prints PDF
  certificate_printed_at set
        │
        ▼  Center can download:
       Provisional Marksheet
       Provisional Certificate
   (both watermarked “PROVISIONAL”)
```

## Database changes (one migration)

- `courses`
  - `theory_max_marks int default 100`
  - `practical_max_marks int default 100`
- `student_results`
  - `theory_marks numeric default 0`
  - `theory_total numeric default 100`
  - `practical_marks numeric default 0`
  - `practical_total numeric default 100`
  - `theory_grace numeric default 0`
  - `practical_grace numeric default 0`
  - `practical_submitted_at timestamptz`
  - `certificate_printed_at timestamptz`
  - Allow status values: `awaiting_practical | pending | declared`
- Backfill: copy current `marks_obtained` → `theory_marks`, `total_marks` → `theory_total`, `grace_marks` → `theory_grace`.
- New RLS for centers on `student_results`:
  - SELECT own (already exists)
  - UPDATE own row only when `status = 'awaiting_practical'` and only `practical_marks` / `practical_total` / `practical_submitted_at` change; lock once `practical_submitted_at` is set.

## Edge function: `exam-completion-webhook`

Extend the accepted payload to optionally include `marks_obtained`, `total_marks`, `theory_marks`, `theory_total`. When present:
- Look up `course_id` from the student.
- Upsert a `student_results` row keyed on `(student_id, exam_date)` with `status = 'awaiting_practical'`, theory marks filled, practical fields zero.
- If no marks in payload, still create the awaiting row with `theory_marks = 0` so center sees the student.

(No changes to signature/idempotency logic.)

## Center portal — new `Results` page

Path: `/center/results`, linked in `CenterLayout` sidebar.

- Tabs: **Awaiting Practical | Submitted | Declared**.
- Awaiting Practical row shows: student, course, theory marks (read-only), practical input + total, Submit button. On submit confirms with a dialog; once submitted row moves to Submitted and is fully read-only.
- Declared tab shows final theory + practical + grace breakdown, total, grade, and — once `certificate_printed_at` is set — two download buttons: **Provisional Marksheet** and **Provisional Certificate**.

## Super admin — `Results` page rewrite

- Declaration tab columns: Student · Course · Theory (marks/total) · Theory Grace (± input) · Practical (marks/total) · Practical Grace (± input) · Final · Declare.
- Filters unchanged; only show rows where center has already submitted practical (`status = 'pending'`).
- “Add Result” dialog adjusted to capture theory + practical or removed (now automatic via webhook). Keep a minimal manual-add for offline cases under a separate “Manual entry” button — theory + practical fields.
- Printing tab: same as today; print actions now also set `certificate_printed_at` on the row.

## PDF generation

- Update `generateMarksheet.ts` and `generateCertificate.ts` to accept a `provisional?: boolean` flag and stamp a light diagonal “PROVISIONAL” watermark plus a footer note when true.
- Center-side download buttons call these generators with `provisional: true`. Admin print stays non-provisional (final copy).

## Hook layer

- Replace `useResults.ts` queries with the new column set (`theory_marks`, `practical_marks`, graces, etc.) and a `useCenterResults` hook for the center portal.
- New mutations: `useSubmitPractical`, `useUpdateGrace(field)`, `useMarkCertificatePrinted`.

## Files touched

- New migration under `supabase/migrations/`
- `supabase/functions/exam-completion-webhook/index.ts`
- `src/hooks/useResults.ts` (rewrite types/queries)
- `src/hooks/useCenterResults.ts` (new)
- `src/pages/admin/Results.tsx` (column rewrite, watermark wiring)
- `src/pages/center/Results.tsx` (new)
- `src/layouts/CenterLayout.tsx` (sidebar entry)
- `src/App.tsx` (route)
- `src/lib/generateMarksheet.ts`, `src/lib/generateCertificate.ts` (provisional watermark)
- Regenerated `src/integrations/supabase/types.ts` after migration

## Assumptions worth confirming

1. The exam-portal webhook can be extended to send `marks_obtained` / `total_marks` (theory). If not, theory marks will default to 0 and admins fill them manually.
2. A single `student_results` row per student per course (matches current behaviour).
3. Provisional documents are identical layout to final ones, just watermarked — no separate template.

If any of these three assumptions are wrong, tell me which and I’ll adjust before building.