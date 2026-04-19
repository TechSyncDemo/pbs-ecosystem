-- Create student_results table
CREATE TABLE public.student_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  marks_obtained NUMERIC NOT NULL DEFAULT 0,
  total_marks NUMERIC NOT NULL DEFAULT 100,
  grace_marks NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  result_date TIMESTAMP WITH TIME ZONE,
  declared_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_results_student_id ON public.student_results(student_id);
CREATE INDEX idx_student_results_status ON public.student_results(status);
CREATE INDEX idx_student_results_course_id ON public.student_results(course_id);

ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

-- Super admins full access
CREATE POLICY "Super admins can manage all results"
  ON public.student_results
  FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Center admins can view results for their own students
CREATE POLICY "Center admins can view own student results"
  ON public.student_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_results.student_id
      AND s.center_id = public.get_user_center_id(auth.uid())
    )
  );

-- Center admins can insert results for their own students
CREATE POLICY "Center admins can insert own student results"
  ON public.student_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_results.student_id
      AND s.center_id = public.get_user_center_id(auth.uid())
    )
  );

-- Center admins can update results for their own students (only pending)
CREATE POLICY "Center admins can update own pending student results"
  ON public.student_results
  FOR UPDATE
  USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_results.student_id
      AND s.center_id = public.get_user_center_id(auth.uid())
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_student_results_updated_at
  BEFORE UPDATE ON public.student_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();