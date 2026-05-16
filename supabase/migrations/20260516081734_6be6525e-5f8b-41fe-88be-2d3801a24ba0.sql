-- Add 8-char alphanumeric certificate number
ALTER TABLE public.student_results
  ADD COLUMN IF NOT EXISTS certificate_no text UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_certificate_no()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text;
  i int;
  exists_flag boolean;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.student_results WHERE certificate_no = result) INTO exists_flag;
    EXIT WHEN NOT exists_flag;
  END LOOP;
  RETURN result;
END;
$$;

-- Public verification by certificate number
CREATE OR REPLACE FUNCTION public.verify_certificate_by_no(_cert_no text)
RETURNS TABLE(
  certificate_no text,
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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    sr.certificate_no,
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
  WHERE upper(sr.certificate_no) = upper(trim(_cert_no))
    AND sr.status = 'declared'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate_by_no(text) TO anon, authenticated;

-- Backfill certificate numbers for already-declared results
UPDATE public.student_results
  SET certificate_no = public.generate_certificate_no()
  WHERE status = 'declared' AND certificate_no IS NULL;