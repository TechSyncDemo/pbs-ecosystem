
The user wants the Results & Certificate Management page (`src/pages/admin/Results.tsx`) to use live data from the database instead of the hardcoded mock arrays.

Looking at the current schema, there's no dedicated `exam_results` or `marks` table. The `students` table has `status` (active, completed, certified) but no marks/exam fields. The `course_topics` table holds the topic-wise max_marks structure.

To make this fully live, I need to add a results/marks storage layer. Here's my plan:

## Plan: Live Result & Certificate Management

### 1. Database additions
Create a new migration:
- **`student_results` table** to store exam results per student:
  - `id`, `student_id` (FK student), `course_id`, `exam_date`, `marks_obtained`, `total_marks`, `grace_marks`, `status` (`pending` | `declared`), `result_date`, `declared_by`, `created_at`, `updated_at`
- RLS policies:
  - Super admins: full ALL access
  - Center admins: SELECT/INSERT for their own center's students (via join through students table)
- Index on `student_id` and `status` for fast filtering

### 2. New hook: `src/hooks/useResults.ts`
- `usePendingResults()` — fetches results joined with `students(name, center_id, centers(name))` and `courses(name)` where `status = 'pending'`
- `useDeclaredResults()` — fetches `status = 'declared'` with same joins
- `useUpdateGraceMarks()` — mutation for grace marks
- `useDeclareResult()` — sets status to `declared`, sets `result_date`, also updates the student's status to `completed`
- `useDeclareMultipleResults()` — bulk declare
- All mutations invalidate relevant query keys

### 3. Refactor `src/pages/admin/Results.tsx`
- Remove `mockPendingResults`, `mockDeclaredResults`, `mockCenters` arrays
- Replace `mockCenters` filter dropdown with live data from `useCenters()` (already exists)
- Wire `pendingResults` table to `usePendingResults()` data
- Wire `declaredResults` table to `useDeclaredResults()` data
- Use the new mutation hooks for declare actions and grace-mark updates
- Add loading states (Loader2) and empty states for both tabs
- Filters (center, date range) work on real data via `useMemo`
- Keep print buttons functional (toast for now — actual PDF generation is a separate feature)

### 4. Where do results come from?
Since there's currently no UI for entering exam marks, I'll add a **"Add Result" dialog** on the Results page so a super admin can record `marks_obtained` for an existing student before declaration. Without this, the pending list will always be empty. The dialog will:
- Pick a student (searchable select of active students)
- Pick the course (auto-filled from student)
- Enter exam date, marks obtained, total marks (default from course's `max_marks`)
- Save as `pending`

### Files to create / edit
- **New migration**: `student_results` table + RLS
- **New**: `src/hooks/useResults.ts`
- **Edit**: `src/pages/admin/Results.tsx` (full rewrite of data layer, keep UI structure)
- `src/integrations/supabase/types.ts` will auto-regenerate

### Out of scope (mention only)
- Actual PDF marksheet/certificate generation — buttons will keep their toast placeholders
- QR-code verification system

