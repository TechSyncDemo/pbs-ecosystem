
CREATE OR REPLACE FUNCTION public.ensure_center_course_for_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id uuid;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT course_id INTO v_course_id
  FROM public.stock_items
  WHERE id = NEW.stock_item_id;

  IF v_course_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.center_courses (center_id, course_id, status, valid_from, valid_until)
  VALUES (NEW.center_id, v_course_id, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days')
  ON CONFLICT (center_id, course_id) DO UPDATE
    SET status = 'active',
        valid_until = GREATEST(public.center_courses.valid_until, CURRENT_DATE + INTERVAL '365 days');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_center_course_for_stock ON public.center_stock;
CREATE TRIGGER trg_ensure_center_course_for_stock
AFTER INSERT OR UPDATE OF quantity, stock_item_id ON public.center_stock
FOR EACH ROW EXECUTE FUNCTION public.ensure_center_course_for_stock();

-- Backfill: ensure every existing center with stock>0 has an authorization
INSERT INTO public.center_courses (center_id, course_id, status, valid_from, valid_until)
SELECT DISTINCT cs.center_id, si.course_id, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days'
FROM public.center_stock cs
JOIN public.stock_items si ON si.id = cs.stock_item_id
WHERE cs.quantity > 0 AND si.course_id IS NOT NULL
ON CONFLICT (center_id, course_id) DO UPDATE SET status = 'active';
