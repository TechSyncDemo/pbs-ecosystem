
-- Replace center UPDATE policy to allow edits until declared
DROP POLICY IF EXISTS "Center admins can submit practical marks" ON public.student_results;

CREATE POLICY "Center admins can edit practical marks until declared"
ON public.student_results
FOR UPDATE
USING (
  status <> 'declared'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_results.student_id
      AND s.center_id = public.get_user_center_id(auth.uid())
  )
)
WITH CHECK (
  status <> 'declared'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_results.student_id
      AND s.center_id = public.get_user_center_id(auth.uid())
  )
);

-- Update RPC to allow editing while not declared (instead of only first submission)
CREATE OR REPLACE FUNCTION public.submit_practical_marks(
  _result_id uuid,
  _practical_marks numeric,
  _practical_total numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_center uuid;
  v_row public.student_results;
BEGIN
  SELECT * INTO v_row FROM public.student_results WHERE id = _result_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Result not found';
  END IF;
  IF v_row.status = 'declared' THEN
    RAISE EXCEPTION 'Result already declared; practical marks are locked';
  END IF;

  SELECT center_id INTO v_center FROM public.students WHERE id = v_row.student_id;
  IF v_center IS DISTINCT FROM public.get_user_center_id(auth.uid())
     AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.student_results
    SET practical_marks = _practical_marks,
        practical_total = _practical_total,
        practical_submitted_at = COALESCE(practical_submitted_at, now()),
        status = CASE WHEN status = 'awaiting_practical' THEN 'pending' ELSE status END,
        updated_at = now()
    WHERE id = _result_id;
END;
$$;
