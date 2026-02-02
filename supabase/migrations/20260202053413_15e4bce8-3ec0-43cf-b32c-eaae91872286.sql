-- 1. Add coordinator_id to centers
ALTER TABLE public.centers ADD COLUMN coordinator_id uuid REFERENCES public.coordinators(id);

-- 2. Add validity dates and registration amount to center_courses (authorizations)
ALTER TABLE public.center_courses ADD COLUMN valid_from date DEFAULT CURRENT_DATE;
ALTER TABLE public.center_courses ADD COLUMN valid_until date DEFAULT (CURRENT_DATE + INTERVAL '365 days');
ALTER TABLE public.center_courses ADD COLUMN registration_amount numeric DEFAULT 0;
ALTER TABLE public.center_courses ADD COLUMN certificate_no text;

-- 3. Add exam_fee and exam_portal_id to courses
ALTER TABLE public.courses ADD COLUMN exam_fee numeric DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN exam_portal_id text;

-- 4. Create course_topics table for syllabus
CREATE TABLE public.course_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  topic_name text NOT NULL,
  max_marks integer DEFAULT 100,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Enable RLS on course_topics
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for course_topics
CREATE POLICY "Authenticated users can view course topics"
ON public.course_topics FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage course topics"
ON public.course_topics FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- 7. Create function to generate center code (PBS + year suffix + sequence)
CREATE OR REPLACE FUNCTION public.generate_center_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_suffix TEXT;
    next_num INTEGER;
    result TEXT;
BEGIN
    year_suffix := to_char(CURRENT_DATE, 'YY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 6) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.centers
    WHERE code LIKE 'PBS' || year_suffix || '%';
    result := 'PBS' || year_suffix || LPAD(next_num::TEXT, 4, '0');
    RETURN result;
END;
$$;

-- 8. Create trigger for updated_at on course_topics
CREATE TRIGGER update_course_topics_updated_at
BEFORE UPDATE ON public.course_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();