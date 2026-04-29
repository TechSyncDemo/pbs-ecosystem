-- 1. Add exam tracking columns to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS exam_status text NOT NULL DEFAULT 'not_attempted',
  ADD COLUMN IF NOT EXISTS exam_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS exam_locked boolean NOT NULL DEFAULT false;

ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_exam_status_check;
ALTER TABLE public.students
  ADD CONSTRAINT students_exam_status_check
  CHECK (exam_status IN ('not_attempted', 'in_progress', 'completed'));

CREATE INDEX IF NOT EXISTS idx_students_enrollment_no ON public.students(enrollment_no);

-- 2. exam_history table
CREATE TABLE IF NOT EXISTS public.exam_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id text,
  exam_title text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  external_attempt_id text NOT NULL,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, external_attempt_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_history_student ON public.exam_history(student_id);

ALTER TABLE public.exam_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage exam history" ON public.exam_history;
CREATE POLICY "Super admins manage exam history"
ON public.exam_history FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Center admins view own exam history" ON public.exam_history;
CREATE POLICY "Center admins view own exam history"
ON public.exam_history FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.students s
  WHERE s.id = exam_history.student_id
    AND s.center_id = get_user_center_id(auth.uid())
));

-- 3. Replace blanket ALL policy on students for center admins with split policies that respect exam_locked
DROP POLICY IF EXISTS "Center admins can manage own students" ON public.students;

CREATE POLICY "Center admins view own students"
ON public.students FOR SELECT
USING (center_id = get_user_center_id(auth.uid()));

CREATE POLICY "Center admins insert own students"
ON public.students FOR INSERT
WITH CHECK (center_id = get_user_center_id(auth.uid()));

CREATE POLICY "Center admins update own unlocked students"
ON public.students FOR UPDATE
USING (center_id = get_user_center_id(auth.uid()) AND exam_locked = false)
WITH CHECK (center_id = get_user_center_id(auth.uid()) AND exam_locked = false);

CREATE POLICY "Center admins delete own students"
ON public.students FOR DELETE
USING (center_id = get_user_center_id(auth.uid()));