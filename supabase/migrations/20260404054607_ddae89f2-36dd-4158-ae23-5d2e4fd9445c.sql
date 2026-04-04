
-- Add course_id column
ALTER TABLE public.stock_items ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;

-- Create unique index
CREATE UNIQUE INDEX stock_items_course_id_unique ON public.stock_items(course_id) WHERE course_id IS NOT NULL;

-- Update category check to include 'course'
ALTER TABLE public.stock_items DROP CONSTRAINT stock_items_category_check;
ALTER TABLE public.stock_items ADD CONSTRAINT stock_items_category_check CHECK (category = ANY (ARRAY['material','certificate','id-card','uniform','other','course']));

-- Create stock items for all existing courses
INSERT INTO public.stock_items (name, code, unit_price, category, course_id, status)
SELECT c.name, c.code, c.fee, 'course', c.id, 'active'
FROM public.courses c
WHERE NOT EXISTS (SELECT 1 FROM public.stock_items si WHERE si.course_id = c.id);

-- Trigger function
CREATE OR REPLACE FUNCTION public.auto_create_stock_item_for_course()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.stock_items (name, code, unit_price, category, course_id, status)
  VALUES (NEW.name, NEW.code, NEW.fee, 'course', NEW.id, 'active')
  ON CONFLICT (course_id) WHERE course_id IS NOT NULL
  DO UPDATE SET name = NEW.name, code = NEW.code, unit_price = NEW.fee;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_stock_item ON public.courses;
CREATE TRIGGER trg_auto_create_stock_item
AFTER INSERT OR UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_stock_item_for_course();
