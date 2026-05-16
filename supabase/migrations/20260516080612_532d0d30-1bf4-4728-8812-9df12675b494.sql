
-- 1. courses: split max marks
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS theory_max_marks integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS practical_max_marks integer NOT NULL DEFAULT 100;

-- 2. student_results: theory / practical split
ALTER TABLE public.student_results
  ADD COLUMN IF NOT EXISTS theory_marks numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS theory_total numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS practical_marks numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practical_total numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS theory_grace numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practical_grace numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practical_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS certificate_printed_at timestamptz;

-- Backfill existing rows
UPDATE public.student_results
SET theory_marks = COALESCE(marks_obtained, 0),
    theory_total = COALESCE(total_marks, 100),
    theory_grace = COALESCE(grace_marks, 0)
WHERE theory_marks = 0 AND theory_grace = 0;

-- 3. Update center RLS to allow practical update while awaiting_practical
DROP POLICY IF EXISTS "Center admins can update own pending student results" ON public.student_results;

CREATE POLICY "Center admins can submit practical marks"
ON public.student_results
FOR UPDATE
USING (
  status = 'awaiting_practical'
  AND practical_submitted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_results.student_id
      AND s.center_id = public.get_user_center_id(auth.uid())
  )
)
WITH CHECK (
  status = 'awaiting_practical'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_results.student_id
      AND s.center_id = public.get_user_center_id(auth.uid())
  )
);

-- 4. Index for lookups by student
CREATE INDEX IF NOT EXISTS idx_student_results_student ON public.student_results(student_id);
