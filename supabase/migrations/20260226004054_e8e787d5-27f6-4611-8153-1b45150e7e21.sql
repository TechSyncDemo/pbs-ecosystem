
-- Add loyalty_points to courses (optional, defaults to 0)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0;

-- Add loyalty tracking to centers
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS loyalty_reset_at timestamp with time zone DEFAULT now();

-- Trigger function: on student insert, add loyalty points to center
CREATE OR REPLACE FUNCTION public.add_loyalty_points_on_admission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  course_loyalty integer;
  center_created timestamp with time zone;
  center_reset timestamp with time zone;
BEGIN
  -- Get loyalty points for this course
  SELECT COALESCE(loyalty_points, 0) INTO course_loyalty
  FROM courses WHERE id = NEW.course_id;

  -- Skip if no loyalty points configured
  IF course_loyalty = 0 THEN
    RETURN NEW;
  END IF;

  -- Check if center's loyalty needs resetting (366 days from created_at or last reset)
  SELECT created_at, COALESCE(loyalty_reset_at, created_at) INTO center_created, center_reset
  FROM centers WHERE id = NEW.center_id;

  -- If more than 366 days since last reset, reset points first
  IF (now() - center_reset) > interval '366 days' THEN
    UPDATE centers
    SET loyalty_points = course_loyalty,
        loyalty_reset_at = now()
    WHERE id = NEW.center_id;
  ELSE
    UPDATE centers
    SET loyalty_points = loyalty_points + course_loyalty
    WHERE id = NEW.center_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on students table
DROP TRIGGER IF EXISTS trg_add_loyalty_on_admission ON public.students;
CREATE TRIGGER trg_add_loyalty_on_admission
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.add_loyalty_points_on_admission();
