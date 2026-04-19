ALTER TABLE public.students ADD COLUMN IF NOT EXISTS exam_portal_id text;
CREATE INDEX IF NOT EXISTS idx_students_exam_portal_id ON public.students(exam_portal_id);