CREATE OR REPLACE FUNCTION public.verify_certificate(_cert_id uuid)
RETURNS TABLE (
  certificate_id uuid,
  student_name text,
  enrollment_no text,
  course_name text,
  center_name text,
  result_date timestamp with time zone,
  marks_obtained numeric,
  total_marks numeric,
  grace_marks numeric,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.id,
    s.name,
    s.enrollment_no,
    c.name,
    ct.name,
    sr.result_date,
    sr.marks_obtained,
    sr.total_marks,
    sr.grace_marks,
    sr.status
  FROM public.student_results sr
  JOIN public.students s ON s.id = sr.student_id
  JOIN public.courses c ON c.id = sr.course_id
  LEFT JOIN public.centers ct ON ct.id = s.center_id
  WHERE sr.id = _cert_id
    AND sr.status = 'declared'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(uuid) TO anon, authenticated;