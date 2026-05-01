CREATE OR REPLACE FUNCTION public.generate_enrollment_no()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    year_suffix TEXT;
    next_num INTEGER;
    result TEXT;
BEGIN
    -- Serialize concurrent generators to prevent duplicate enrollment numbers
    PERFORM pg_advisory_xact_lock(hashtext('generate_enrollment_no'));

    year_suffix := to_char(CURRENT_DATE, 'YY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(enrollment_no FROM 6) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.students
    WHERE enrollment_no LIKE 'PBS' || year_suffix || '%'
      AND SUBSTRING(enrollment_no FROM 6) ~ '^[0-9]+$';

    result := 'PBS' || year_suffix || LPAD(next_num::TEXT, 5, '0');

    -- Defensive: keep incrementing if (somehow) it already exists
    WHILE EXISTS (SELECT 1 FROM public.students WHERE enrollment_no = result) LOOP
      next_num := next_num + 1;
      result := 'PBS' || year_suffix || LPAD(next_num::TEXT, 5, '0');
    END LOOP;

    RETURN result;
END;
$function$;