
CREATE OR REPLACE FUNCTION public.submit_practical_marks(
  _result_id uuid,
  _practical_marks numeric,
  _practical_total numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center uuid;
  v_row public.student_results;
BEGIN
  SELECT * INTO v_row FROM public.student_results WHERE id = _result_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Result not found';
  END IF;
  IF v_row.status <> 'awaiting_practical' OR v_row.practical_submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Practical marks already submitted';
  END IF;

  SELECT center_id INTO v_center FROM public.students WHERE id = v_row.student_id;
  IF v_center IS DISTINCT FROM public.get_user_center_id(auth.uid())
     AND NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.student_results
    SET practical_marks = _practical_marks,
        practical_total = _practical_total,
        practical_submitted_at = now(),
        status = 'pending',
        updated_at = now()
    WHERE id = _result_id;
END;
$$;
